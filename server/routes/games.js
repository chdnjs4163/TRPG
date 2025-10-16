const express = require("express");
const router = express.Router();
const pool = require("../db");
const { success, error } = require("../utils/response");
const {
  uuid,
  normalizeId,
  parseJson,
  serializeJson,
  ensureGameExists,
} = require("../utils/ai");
const charactersModule = require("./characters");
const getCharactersForGame = charactersModule.getCharactersForGame;
const mapCharacter = charactersModule.mapCharacter;
const gameTitlesModule = require("./game_titles");
const fetchTitleById = gameTitlesModule.fetchTitleById;
const { serializeScenario } = require("../utils/scenario");

function formatGameRow(row) {
  return {
    id: row.game_id,
    title: row.title,
    genre: row.genre,
    difficulty: row.difficulty,
    metadata: parseJson(row.metadata, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchGame(gameId) {
  const [rows] = await pool.query(
    `SELECT game_id, title, genre, difficulty, metadata, created_at, updated_at
     FROM ai_games
     WHERE game_id = ?
     LIMIT 1`,
    [gameId]
  );
  return rows[0] || null;
}

async function getGameTitleRecord(gameId) {
  const [rows] = await pool.query(
    `SELECT game_id, title_id
     FROM games
     WHERE game_id = ?
     LIMIT 1`,
    [gameId]
  );
  if (!rows.length) {
    return { game: null, titleId: null };
  }
  return { game: rows[0], titleId: rows[0].title_id };
}

// ===== 기존 슬롯 관련 엔드포인트 (호환성 유지) =====

// 유저별 게임 슬롯 조회
router.get("/user/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          g.game_id AS id,
          gt.title_name AS title,
          gt.thumbnail_url AS image,
          g.last_played AS date,
          g.status,
          g.title_id,
          COALESCE(
            (SELECT name FROM ai_characters WHERE game_id = g.game_id ORDER BY updated_at DESC, created_at DESC LIMIT 1),
            (SELECT name FROM characters WHERE game_id = g.game_id ORDER BY created_at DESC LIMIT 1)
          ) AS character_name
       FROM games g
       JOIN game_titles gt ON g.title_id = gt.title_id
       WHERE g.user_id = ?
       ORDER BY g.last_played DESC`,
      [req.params.userId]
    );
    success(res, rows);
  } catch (err) {
    console.error(err);
    error(res, "게임 슬롯 조회 실패");
  }
});

// 기존 슬롯 업데이트 (status, last_played 등)
router.put("/:gameId", async (req, res) => {
  const { status, last_played } = req.body;
  try {
    await pool.query("UPDATE games SET status=?, last_played=? WHERE game_id=?", [
      status,
      last_played,
      req.params.gameId,
    ]);
    success(res, null, "게임 슬롯 업데이트 완료");
  } catch (err) {
    console.error(err);
    error(res, "게임 슬롯 업데이트 실패");
  }
});

// 특정 사용자와 타이틀로 최근 슬롯 조회
router.get("/find", async (req, res) => {
  try {
    const { user_id, title_id } = req.query;
    if (!user_id || !title_id) return error(res, "user_id, title_id가 필요합니다.", 400);
    const [rows] = await pool.query(
      `SELECT 
          g.game_id AS id,
          gt.title_name AS title,
          gt.thumbnail_url AS image,
          g.last_played AS date,
          g.status,
          g.title_id,
          COALESCE(
            (SELECT name FROM ai_characters WHERE game_id = g.game_id ORDER BY updated_at DESC, created_at DESC LIMIT 1),
            (SELECT name FROM characters WHERE game_id = g.game_id ORDER BY created_at DESC LIMIT 1)
          ) AS character_name
       FROM games g
       JOIN game_titles gt ON g.title_id = gt.title_id
       WHERE g.user_id = ? AND g.title_id = ?
       ORDER BY g.last_played DESC
       LIMIT 1`,
      [user_id, title_id]
    );
    success(res, rows[0] || null);
  } catch (err) {
    console.error(err);
    error(res, "게임 슬롯 조회 실패");
  }
});

// 게임 슬롯 생성
router.post("/", async (req, res) => {
  const { user_id, title_id, slot_number = 1, status = "ongoing" } = req.body;
  try {
    if (!user_id || !title_id) return error(res, "user_id, title_id는 필수입니다.", 400);
    const [result] = await pool.query(
      "INSERT INTO games (user_id, title_id, slot_number, status, last_played) VALUES (?, ?, ?, ?, NOW())",
      [user_id, title_id, slot_number, status]
    );
    const [rows] = await pool.query(
      `SELECT 
          g.game_id AS id,
          gt.title_name AS title,
          gt.thumbnail_url AS image,
          g.last_played AS date,
          g.status,
          g.title_id,
          COALESCE(
            (SELECT name FROM ai_characters WHERE game_id = g.game_id ORDER BY updated_at DESC, created_at DESC LIMIT 1),
            (SELECT name FROM characters WHERE game_id = g.game_id ORDER BY created_at DESC LIMIT 1)
          ) AS character_name
       FROM games g
       JOIN game_titles gt ON g.title_id = gt.title_id
       WHERE g.game_id = ?
       LIMIT 1`,
      [result.insertId]
    );
    success(res, rows[0], "게임 슬롯 생성 완료");
  } catch (err) {
    console.error(err);
    error(res, "게임 슬롯 생성 실패");
  }
});

// ===== ai_server_api 명세 대응 엔드포인트 =====

router.get("/:gameId", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const game = await fetchGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    res.json(formatGameRow(game));
  } catch (err) {
    console.error("[games.get] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:gameId", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const { title, genre, difficulty, metadata } = req.body || {};

    if (
      title === undefined &&
      genre === undefined &&
      difficulty === undefined &&
      metadata === undefined
    ) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const existing = await fetchGame(gameId);
    const resolvedTitle =
      title !== undefined ? String(title) : existing?.title || `Game ${gameId}`;
    const resolvedGenre =
      genre !== undefined ? (genre === null ? null : String(genre)) : existing?.genre || null;
    const resolvedDifficulty =
      difficulty !== undefined
        ? difficulty === null
          ? null
          : String(difficulty)
        : existing?.difficulty || null;

    const existingMetadata = existing ? parseJson(existing.metadata, null) : null;
    const resolvedMetadata = metadata === undefined ? existingMetadata : metadata;
    const serializedMetadata = serializeJson(resolvedMetadata ?? null) ?? "null";

    await pool.query(
      `INSERT INTO ai_games (game_id, title, genre, difficulty, metadata)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         genre = VALUES(genre),
         difficulty = VALUES(difficulty),
         metadata = VALUES(metadata)`,
      [gameId, resolvedTitle, resolvedGenre, resolvedDifficulty, serializedMetadata]
    );

    const updated = await fetchGame(gameId);
    res.json(formatGameRow(updated));
  } catch (err) {
    console.error("[games.patch] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:gameId/title", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const { game, titleId } = await getGameTitleRecord(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    if (!titleId) {
      return res.status(404).json({ error: "Title not found for game" });
    }
    const title = await fetchTitleById(titleId);
    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }
    res.json(title);
  } catch (err) {
    console.error("[games.title.get] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:gameId/title", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const { game } = await getGameTitleRecord(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const { title, title_name, description, image, thumbnail_url, genre, theme, scenario, scenario_json } = req.body || {};
    const resolvedTitle = (title ?? title_name)?.trim();
    if (!resolvedTitle) {
      return res.status(400).json({ error: "title is required" });
    }

    let scenarioPayload;
    try {
      scenarioPayload = serializeScenario(scenario ?? scenario_json);
    } catch (serializeErr) {
      if (serializeErr.message === "INVALID_SCENARIO") {
        return res.status(400).json({ error: "scenario must be valid JSON" });
      }
      throw serializeErr;
    }

    const [result] = await pool.query(
      `INSERT INTO game_titles (title_name, description, thumbnail_url, theme, scenario_json, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [resolvedTitle, description ?? null, image ?? thumbnail_url ?? null, genre ?? theme ?? null, scenarioPayload ?? null]
    );

    await pool.query(
      `UPDATE games SET title_id = ? WHERE game_id = ?`,
      [result.insertId, gameId]
    );

    const created = await fetchTitleById(result.insertId);
    res.status(201).json(created);
  } catch (err) {
    console.error("[games.title.post] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:gameId/title", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const { game, titleId } = await getGameTitleRecord(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    if (!titleId) {
      return res.status(404).json({ error: "Title not found for game" });
    }

    const { title, title_name, description, image, thumbnail_url, genre, theme, scenario, scenario_json } = req.body || {};

    const fields = [];
    const params = [];

    if (title !== undefined || title_name !== undefined) {
      const resolvedTitle = (title ?? title_name)?.trim();
      if (!resolvedTitle) {
        return res.status(400).json({ error: "title cannot be empty" });
      }
      fields.push("title_name = ?");
      params.push(resolvedTitle);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description ?? null);
    }

    if (image !== undefined || thumbnail_url !== undefined) {
      fields.push("thumbnail_url = ?");
      params.push(image ?? thumbnail_url ?? null);
    }

    if (genre !== undefined || theme !== undefined) {
      fields.push("theme = ?");
      params.push(genre ?? theme ?? null);
    }

    if (scenario !== undefined || scenario_json !== undefined) {
      let scenarioPayload;
      try {
        scenarioPayload = serializeScenario(scenario ?? scenario_json);
      } catch (serializeErr) {
        if (serializeErr.message === "INVALID_SCENARIO") {
          return res.status(400).json({ error: "scenario must be valid JSON" });
        }
        throw serializeErr;
      }
      fields.push("scenario_json = ?");
      params.push(scenarioPayload ?? null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(titleId);

    const [result] = await pool.query(
      `UPDATE game_titles SET ${fields.join(", ")} WHERE title_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Title not found" });
    }

    const updated = await fetchTitleById(titleId);
    res.json(updated);
  } catch (err) {
    console.error("[games.title.patch] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:gameId/title", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const { game, titleId } = await getGameTitleRecord(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    if (!titleId) {
      return res.status(404).json({ error: "Title not found for game" });
    }

    const [result] = await pool.query("DELETE FROM game_titles WHERE title_id = ?", [titleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Title not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[games.title.delete] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:gameId/characters", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const rows = await getCharactersForGame(gameId);
    res.json(rows.map(mapCharacter));
  } catch (err) {
    console.error("[games.characters.list] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:gameId/characters", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const {
      userId,
      name,
      class: className,
      level,
      stats,
      inventory,
      avatar,
      id: providedId,
      characterId,
    } = req.body || {};

    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId || !name) {
      return res.status(400).json({ error: "Missing required fields: userId, name" });
    }

    const newCharacterId =
      normalizeId(providedId) || normalizeId(characterId) || `ch-${uuid()}`;
    const resolvedLevel = Number.isFinite(Number(level)) ? Number(level) : 1;
    const serializedStats = serializeJson(stats ?? {}) ?? "{}";
    const serializedInventory = serializeJson(inventory ?? []) ?? "[]";

    await ensureGameExists(gameId);

    await pool.query(
      `INSERT INTO ai_characters (character_id, game_id, user_id, name, class, level, stats, inventory, avatar)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?)`,
      [
        newCharacterId,
        gameId,
        normalizedUserId,
        String(name),
        className ? String(className) : null,
        resolvedLevel,
        serializedStats,
        serializedInventory,
        avatar ? String(avatar) : null,
      ]
    );

    res.status(201).json({ id: newCharacterId });
  } catch (err) {
    console.error("[games.characters.create] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

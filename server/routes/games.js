const express = require("express");
const router = express.Router();
const pool = require("../db");
const { success, error } = require("../utils/response");
const { uuid, normalizeId, parseJson, serializeJson, ensureGameExists } = require("../utils/ai");
const authRouter = require("./auth");
const authenticateToken = authRouter.authenticateToken;
const {
  getCharactersForGame,
  mapCharacter,
  calculateHealth,
  resolveHealthColumnInfo,
} = require("./characters");

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

async function verifyOwnership(gameId, userId) {
  if (!gameId || !userId) return false;
  const [rows] = await pool.query(
    `SELECT 1
     FROM ai_characters
     WHERE game_id = ? AND user_id = ?
     LIMIT 1`,
    [gameId, userId]
  );
  return rows.length > 0;
}

router.get("/user/:userId", async (req, res) => {
  try {
    const userId = normalizeId(req.params.userId);
    if (!userId) {
      return error(res, "유효한 사용자 ID가 필요합니다.", 400);
    }

    const [rows] = await pool.query(
      `SELECT
         g.game_id,
         g.title,
         g.genre,
         g.difficulty,
         g.metadata,
         g.created_at,
         g.updated_at,
         c.name AS character_name,
         c.avatar AS character_avatar,
         c.updated_at AS character_updated_at
       FROM ai_games g
       JOIN ai_characters c
         ON c.game_id = g.game_id
       WHERE c.user_id = ?
         AND NOT EXISTS (
           SELECT 1
           FROM ai_characters c2
           WHERE c2.game_id = c.game_id
             AND c2.user_id = c.user_id
             AND (
               c2.updated_at > c.updated_at OR
               (c2.updated_at = c.updated_at AND c2.created_at > c.created_at)
             )
         )
       ORDER BY COALESCE(c.updated_at, g.updated_at, g.created_at) DESC`,
      [userId]
    );

    const normalized = rows.map((row) => {
      const metadata = parseJson(row.metadata, null);
      const thumbnail =
        metadata?.thumbnail ||
        metadata?.image ||
        metadata?.thumbnailUrl ||
        metadata?.thumbnail_url ||
        null;
      return {
        id: row.game_id,
        title: row.title,
        date: row.character_updated_at || row.updated_at || row.created_at,
        image: thumbnail || row.character_avatar || null,
        status: metadata?.status || null,
        titleId: metadata?.templateId || metadata?.titleId || null,
        characterName: row.character_name || null,
        genre: row.genre || metadata?.genre || metadata?.theme || null,
        description: metadata?.description || null,
      };
    });

    success(res, normalized);
  } catch (err) {
    console.error("[games.user] error:", err);
    error(res, "게임 목록을 불러오지 못했습니다.");
  }
});

router.get("/:gameId/access", authenticateToken, async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    if (!gameId) {
      return res.status(400).json({ error: "Invalid game id" });
    }
    const game = await fetchGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    const ownerId = normalizeId(req.user?.id);
    if (!ownerId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const ownsGame = await verifyOwnership(gameId, ownerId);
    if (!ownsGame) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("[games.access] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { id, game_id, title, genre, difficulty, metadata } = req.body || {};
    const requestedId = normalizeId(game_id ?? id);
    const gameId = requestedId || `game-${uuid()}`;

    await ensureGameExists(gameId, { title, genre, difficulty, metadata });

    const created = await fetchGame(gameId);
    if (!created) {
      return res.status(500).json({ error: "Failed to create game" });
    }
    res.status(201).json(formatGameRow(created));
  } catch (err) {
    console.error("[games.create] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

    const statsObject = parseJson(serializedStats, {});
    const computedHealth = calculateHealth(statsObject);
    const healthPayload = { current: computedHealth, max: computedHealth };
    const healthInfo = await resolveHealthColumnInfo();
    const columnName = healthInfo?.name || "health";
    const placeholder = healthInfo?.isJson ? "CAST(? AS JSON)" : "?";
    const healthValue = healthInfo?.isJson
      ? JSON.stringify(healthPayload)
      : Math.round(computedHealth);

    await pool.query(
      `INSERT INTO ai_characters (character_id, game_id, user_id, name, class, level, stats, inventory, avatar, ${columnName})
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ${placeholder})`,
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
        healthValue,
      ]
    );

    res.status(201).json({ id: newCharacterId });
  } catch (err) {
    console.error("[games.characters.create] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { success, error } = require("../utils/response");
const { normalizeId, parseJson, serializeJson, ensureGameExists, ensureCharacterExists } = require("../utils/ai");
function calculateHealth(stats) {
  const baseHealth = 100;
  if (!stats || typeof stats !== "object") return baseHealth;
  let total = 0;
  for (const value of Object.values(stats)) {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      total += num;
    }
  }
  const bonus = baseHealth * (total / 100);
  return Math.round(baseHealth + bonus);
}
function mapCharacter(row) {
  const stats = parseJson(row.stats, {});
  const inventory = parseJson(row.inventory, []);
  const storedHealth = Number(row.health);
  const health = !Number.isNaN(storedHealth) && storedHealth > 0 ? storedHealth : calculateHealth(stats);
  return {
    id: row.character_id,
    userId: row.user_id,
    gameId: row.game_id,
    name: row.name,
    class: row.class,
    level: row.level,
    stats,
    inventory,
    avatar: row.avatar,
    health,
    maxHealth: health,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}
async function fetchAiCharacter(characterId) {
  const [rows] = await pool.query(
    `SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, created_at, updated_at
     FROM ai_characters
     WHERE character_id = ?
     LIMIT 1`,
    [characterId]
  );
  return rows[0] || null;
}
async function importLegacyCharacter(characterId) {
  const [legacyRows] = await pool.query(
    `SELECT 
        c.character_id,
        c.game_id,
        c.name,
        c.class,
        c.level,
        c.stats,
        c.inventory,
        g.user_id
     FROM characters c
     LEFT JOIN games g ON c.game_id = g.game_id
     WHERE c.character_id = ?
     LIMIT 1`,
    [characterId]
  );
  if (legacyRows.length === 0) return null;
  const legacy = legacyRows[0];
  const gameId = normalizeId(legacy.game_id);
  if (!gameId) return null;
  const userId =
    normalizeId(legacy.user_id) || `legacy-user-${gameId}`;
  const statsObj = parseJson(legacy.stats, {});
  const inventoryObj = parseJson(legacy.inventory, []);
  await ensureCharacterExists(normalizeId(legacy.character_id), {
    gameId,
    userId,
    name: legacy.name,
    className: legacy.class,
    level: Number(legacy.level) || 1,
    stats: statsObj,
    inventory: inventoryObj,
  });
  return await fetchAiCharacter(characterId);
}
async function getCharacterOrImport(characterId) {
  const normalizedId = normalizeId(characterId);
  if (!normalizedId) return null;
  const existing = await fetchAiCharacter(normalizedId);
  if (existing) return existing;
  return await importLegacyCharacter(normalizedId);
}
async function getCharactersForGame(gameId) {
  const normalizedGameId = normalizeId(gameId);
  if (!normalizedGameId) return [];
  const [aiRows] = await pool.query(
    `SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, created_at, updated_at
     FROM ai_characters
     WHERE game_id = ?
     ORDER BY created_at ASC`,
    [normalizedGameId]
  );
  const rows = [...aiRows];
  const seen = new Set(rows.map((row) => normalizeId(row.character_id)));
  const [legacyRows] = await pool.query(
    `SELECT 
        c.character_id,
        c.game_id,
        c.name,
        c.class,
        c.level,
        c.stats,
        c.inventory,
        g.user_id
     FROM characters c
     LEFT JOIN games g ON c.game_id = g.game_id
     WHERE c.game_id = ?`,
    [normalizedGameId]
  );
  for (const legacy of legacyRows) {
    const charId = normalizeId(legacy.character_id);
    if (!charId || seen.has(charId)) continue;
    const imported = await importLegacyCharacter(charId);
    if (imported) {
      rows.push(imported);
      seen.add(charId);
    }
  }
  rows.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return aTime - bTime;
  });
  return rows;
}
// 특정 게임의 캐릭터 목록 (호환용)
router.get("/game/:gameId", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const rows = await getCharactersForGame(gameId);
    success(res, rows.map(mapCharacter));
  } catch (err) {
    console.error("캐릭터 조회 오류:", err);
    error(res, "캐릭터 조회 실패");
  }
});
// 캐릭터 생성 (호환용)
router.post("/", async (req, res) => {
  try {
    const {
      game_id,
      user_id,
      name,
      class: className,
      level = 1,
      stats = {},
      inventory = [],
      avatar = null,
      character_id,
    } = req.body || {};
    if (!game_id || !user_id || !name) {
      return error(res, "game_id, user_id, name은 필수입니다.", 400);
    }
    const characterId = normalizeId(character_id) || normalizeId(req.body?.id) || `ch-${Date.now()}`;
    const serializedStats = serializeJson(stats ?? {}) ?? "{}";
    const serializedInventory = serializeJson(inventory ?? []) ?? "[]";
    const normalizedGameId = normalizeId(game_id);
    await ensureGameExists(normalizedGameId);
    const parsedStats = parseJson(serializedStats, {});
    const computedHealth = calculateHealth(parsedStats);
    await pool.query(
      `INSERT INTO ai_characters (character_id, game_id, user_id, name, class, level, stats, inventory, avatar, health)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?)`,
      [
        characterId,
        normalizedGameId,
        normalizeId(user_id),
        String(name),
        className ? String(className) : null,
        Number(level) || 1,
        serializedStats,
        serializedInventory,
        avatar ? String(avatar) : null,
        computedHealth,
      ]
    );
    success(res, { character_id: characterId, game_id, name, class: className, level: Number(level) || 1, health: computedHealth }, "캐릭터 생성 완료");
  } catch (err) {
    console.error("캐릭터 생성 오류:", err);
    error(res, "캐릭터 생성 실패");
  }
});
async function updateCharacter(characterId, payload) {
  const fields = [];
  const values = [];
  if (payload.name !== undefined) {
    fields.push("name = ?");
    values.push(payload.name ? String(payload.name) : null);
  }
  if (payload.class !== undefined) {
    fields.push("class = ?");
    values.push(payload.class ? String(payload.class) : null);
  }
  if (payload.level !== undefined) {
    fields.push("level = ?");
    values.push(Number(payload.level) || 1);
  }
  let computedHealth;
  if (payload.stats !== undefined) {
    const serialized = serializeJson(payload.stats ?? {}) ?? "{}";
    fields.push("stats = CAST(? AS JSON)");
    values.push(serialized);
    const parsed = parseJson(serialized, {});
    computedHealth = calculateHealth(parsed);
  }
  if (payload.inventory !== undefined) {
    fields.push("inventory = CAST(? AS JSON)");
    values.push(serializeJson(payload.inventory ?? []) ?? "[]");
  }
  if (payload.avatar !== undefined) {
    fields.push("avatar = ?");
    values.push(payload.avatar ? String(payload.avatar) : null);
  }
  if (payload.health !== undefined) {
    const requested = Number(payload.health);
    if (!Number.isNaN(requested) && requested > 0) {
      computedHealth = Math.round(requested);
    }
  }
  if (computedHealth !== undefined) {
    fields.push("health = ?");
    values.push(computedHealth);
  }
  if (fields.length === 0) {
    return false;
  }
  values.push(characterId);
  const [result] = await pool.query(
    `UPDATE ai_characters SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE character_id = ?`,
    values
  );
  return result.affectedRows > 0;
}

async function resolvePrimaryCharacterIdForGame(gameId) {
  const normalizedGameId = normalizeId(gameId);
  if (!normalizedGameId) return null;
  const [rows] = await pool.query(
    `SELECT character_id
     FROM ai_characters
     WHERE game_id = ?
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [normalizedGameId]
  );
  if (rows.length > 0) {
    return normalizeId(rows[0].character_id);
  }
  const imported = await getCharactersForGame(normalizedGameId);
  if (imported.length === 0) return null;
  const candidate = imported[imported.length - 1] || imported[0];
  return normalizeId(candidate.character_id || candidate.id);
}
// 캐릭터 수정 (PUT 호환 + PATCH)
router.put("/:characterId", async (req, res) => {
  try {
    const characterId = normalizeId(req.params.characterId);
    const updated = await updateCharacter(characterId, req.body || {});
    if (!updated) {
      return error(res, "업데이트할 필드가 없거나 캐릭터를 찾을 수 없습니다.", 400);
    }
    success(res, null, "캐릭터 업데이트 완료");
  } catch (err) {
    console.error("캐릭터 수정 오류:", err);
    error(res, "캐릭터 업데이트 실패");
  }
});
router.patch("/game/:gameId", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    if (!gameId) {
      return error(res, "유효하지 않은 gameId 입니다.", 400);
    }
    const characterId = await resolvePrimaryCharacterIdForGame(gameId);
    if (!characterId) {
      return error(res, "해당 게임의 캐릭터를 찾을 수 없습니다.", 404);
    }
    const updated = await updateCharacter(characterId, req.body || {});
    if (!updated) {
      return error(res, "업데이트할 필드가 없거나 캐릭터를 찾을 수 없습니다.", 400);
    }
    const [rows] = await pool.query(
      `SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, health, created_at, updated_at
       FROM ai_characters
       WHERE character_id = ?
       LIMIT 1`,
      [characterId]
    );
    if (rows.length === 0) {
      return error(res, "캐릭터를 찾을 수 없습니다.", 404);
    }
    const mapped = mapCharacter(rows[0]);
    success(res, mapped, "캐릭터 업데이트 완료");
  } catch (err) {
    console.error("[characters.patchByGame] error:", err);
    error(res, "캐릭터 업데이트 실패");
  }
});

router.patch("/:characterId", async (req, res) => {
  try {
    const characterId = normalizeId(req.params.characterId);
    const updated = await updateCharacter(characterId, req.body || {});
    if (!updated) {
      return res.status(400).json({ error: "No updates applied or character not found" });
    }
    const [rows] = await pool.query(
      `SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, created_at, updated_at
       FROM ai_characters
       WHERE character_id = ?
       LIMIT 1`,
      [characterId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Character not found" });
    }
    res.json(mapCharacter(rows[0]));
  } catch (err) {
    console.error("[characters.patch] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// 캐릭터 삭제
router.delete("/:characterId", async (req, res) => {
  try {
    const characterId = normalizeId(req.params.characterId);
    const [result] = await pool.query("DELETE FROM ai_characters WHERE character_id = ?", [characterId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Character not found" });
    }
    success(res, null, "캐릭터 삭제 완료");
  } catch (err) {
    console.error("캐릭터 삭제 오류:", err);
    error(res, "캐릭터 삭제 실패");
  }
});
// 캐릭터 단일 조회 (호환)
router.get("/detail/:characterId", async (req, res) => {
  try {
    const characterId = normalizeId(req.params.characterId);
    const row = await getCharacterOrImport(characterId);
    if (!row) return error(res, "캐릭터를 찾을 수 없음", 404);
    success(res, mapCharacter(row));
  } catch (err) {
    console.error("캐릭터 상세 조회 오류:", err);
    error(res, "캐릭터 상세 조회 실패");
  }
});
// 명세: GET /api/characters/:characterId
router.get("/:characterId", async (req, res) => {
  try {
    const characterId = normalizeId(req.params.characterId);
    const row = await getCharacterOrImport(characterId);
    if (!row) {
      return res.status(404).json({ error: "Character not found" });
    }
    res.json(mapCharacter(row));
  } catch (err) {
    console.error("[characters.get] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
module.exports.getCharactersForGame = getCharactersForGame;
module.exports.mapCharacter = mapCharacter;

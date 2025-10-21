const express = require("express");
const router = express.Router();
const pool = require("../db");
const { success, error } = require("../utils/response");
const {
  normalizeId,
  parseJson,
  serializeJson,
  ensureGameExists,
  ensureCharacterExists,
} = require("../utils/ai");

const toNumber = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const parseHealthColumn = (rawHealth) => {
  const parsed = parseJson(rawHealth, null);
  if (parsed && typeof parsed === "object") {
    const current =
      toNumber(parsed.current) ??
      toNumber(parsed.value) ??
      toNumber(parsed.health) ??
      toNumber(parsed.hp) ??
      toNumber(parsed.amount);
    const max =
      toNumber(parsed.max) ??
      toNumber(parsed.maximum) ??
      toNumber(parsed.maxHealth) ??
      toNumber(parsed.total) ??
      toNumber(parsed.max_hp);
    return { current, max };
  }
  const numeric = toNumber(rawHealth);
  return { current: numeric, max: undefined };
};

const buildHealthPayload = (current, max) => {
  const resolvedCurrent = toNumber(current);
  const resolvedMax = toNumber(max);
  const payload = {};
  if (resolvedCurrent !== undefined) payload.current = Math.round(resolvedCurrent);
  if (resolvedMax !== undefined) payload.max = Math.round(resolvedMax);
  return payload;
};

const HEALTH_COLUMN_CANDIDATES = ["health", "health_json"];

let cachedHealthColumnInfo = null;

async function resolveHealthColumnInfo() {
  if (cachedHealthColumnInfo) return cachedHealthColumnInfo;
  try {
    const placeholders = HEALTH_COLUMN_CANDIDATES.map(() => "?").join(",");
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ai_characters'
         AND COLUMN_NAME IN (${placeholders})
       ORDER BY FIELD(COLUMN_NAME, ${HEALTH_COLUMN_CANDIDATES.map(() => "?").join(",")})
       LIMIT 1`,
      [...HEALTH_COLUMN_CANDIDATES, ...HEALTH_COLUMN_CANDIDATES]
    );
    if (rows.length > 0) {
      const row = rows[0];
      const dataType = (row.DATA_TYPE || row.data_type || "").toString().toLowerCase();
      cachedHealthColumnInfo = {
        name: row.COLUMN_NAME || row.column_name,
        isJson: dataType === "json",
      };
      return cachedHealthColumnInfo;
    }
  } catch (err) {
    if (err?.code !== "ER_NO_SUCH_TABLE") {
      throw err;
    }
  }

  // Fallback probing when INFORMATION_SCHEMA unavailable
  for (const column of HEALTH_COLUMN_CANDIDATES) {
    try {
      await pool.query(`SELECT ${column} FROM ai_characters LIMIT 1`);
      cachedHealthColumnInfo = { name: column, isJson: column !== "health" }; // assume legacy health is numeric
      return cachedHealthColumnInfo;
    } catch (err) {
      if (err?.code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
    }
  }
  return null;
}

async function selectCharacterRows(queryBuilder, params) {
  const info = await resolveHealthColumnInfo();
  if (info?.name) {
    const sql = queryBuilder(info.name);
    const [rows] = await pool.query(sql, params);
    return rows;
  }
  // Final fallback: attempt with primary candidate
  const sql = queryBuilder("health");
  const [rows] = await pool.query(sql, params);
  return rows;
}
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
  const stored = parseHealthColumn(row.health);
  const computedFallback = calculateHealth(stats);

  const health =
    toNumber(stored.current) ??
    toNumber(row.health_current) ??
    toNumber(row.health) ??
    computedFallback;

  const maxHealth =
    toNumber(stored.max) ??
    toNumber(row.health_max) ??
    health ??
    computedFallback;

  const resolvedHealth = Math.max(0, Math.round(health));
  const resolvedMaxHealth = Math.max(resolvedHealth, Math.round(maxHealth ?? resolvedHealth));

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
    health: resolvedHealth,
    maxHealth: resolvedMaxHealth,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}
async function fetchAiCharacter(characterId) {
  const rows = await selectCharacterRows(
    (healthColumn) => `
      SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, ${healthColumn} AS health, created_at, updated_at
      FROM ai_characters
      WHERE character_id = ?
      LIMIT 1
    `,
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
  const aiRows = await selectCharacterRows(
    (healthColumn) => `
      SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, ${healthColumn} AS health, created_at, updated_at
      FROM ai_characters
      WHERE game_id = ?
      ORDER BY created_at ASC
    `,
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
    const healthPayload = buildHealthPayload(computedHealth, computedHealth);
    const healthInfo = await resolveHealthColumnInfo();
    const healthColumn = healthInfo?.name || "health";
    const healthPlaceholder = healthInfo?.isJson ? "CAST(? AS JSON)" : "?";
    const healthValue = healthInfo?.isJson
      ? JSON.stringify(healthPayload)
      : Math.round(toNumber(healthPayload.current) ?? computedHealth);
    await pool.query(
      `INSERT INTO ai_characters (character_id, game_id, user_id, name, class, level, stats, inventory, avatar, ${healthColumn})
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ${healthPlaceholder})`,
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
        healthValue,
      ]
    );
    success(
      res,
      {
        character_id: characterId,
        game_id,
        name,
        class: className,
        level: Number(level) || 1,
        health: computedHealth,
        maxHealth: computedHealth,
      },
      "캐릭터 생성 완료"
    );
  } catch (err) {
    console.error("캐릭터 생성 오류:", err);
    error(res, "캐릭터 생성 실패");
  }
});
async function updateCharacter(characterId, payload) {
  const existingRows = await selectCharacterRows(
    (healthColumn) => `
      SELECT ${healthColumn} AS health, stats
      FROM ai_characters
      WHERE character_id = ?
      LIMIT 1
    `,
    [characterId]
  );
  if (existingRows.length === 0) return false;
  const existingRow = existingRows[0];

  const existingStats = parseJson(existingRow.stats, {});
  const existingHealthParsed = parseHealthColumn(existingRow.health);
  const existingCurrentRaw =
    toNumber(existingHealthParsed.current) ??
    toNumber(existingRow.health_current) ??
    toNumber(existingRow.health) ??
    calculateHealth(existingStats);
  const existingMaxRaw =
    toNumber(existingHealthParsed.max) ??
    existingCurrentRaw ??
    calculateHealth(existingStats);

  const existingCurrent = Math.max(0, Math.round(existingCurrentRaw));
  const existingMax = Math.max(existingCurrent, Math.round(existingMaxRaw ?? existingCurrent));

  const fields = [];
  const values = [];
  let computedHealth;
  let nextCurrent = existingCurrent;
  let nextMax = existingMax;
  let healthExplicitlyProvided = false;
  let maxExplicitlyProvided = false;

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
  if (payload.stats !== undefined) {
    const serialized = serializeJson(payload.stats ?? {}) ?? "{}";
    fields.push("stats = CAST(? AS JSON)");
    values.push(serialized);
    const parsed = parseJson(serialized, {});
    computedHealth = calculateHealth(parsed);
    nextMax = computedHealth;
    if (!healthExplicitlyProvided) {
      nextCurrent = Math.min(nextCurrent, nextMax);
    }
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
    healthExplicitlyProvided = true;
    const incoming = payload.health;
    if (typeof incoming === "number") {
      const numeric = toNumber(incoming);
      if (numeric !== undefined) {
        nextCurrent = numeric;
      }
    } else if (typeof incoming === "string") {
      try {
        const parsed = JSON.parse(incoming);
        const normalized = parseHealthColumn(parsed);
        if (normalized.current !== undefined) nextCurrent = normalized.current;
        if (normalized.max !== undefined) {
          nextMax = normalized.max;
          maxExplicitlyProvided = true;
        }
      } catch {
        const numeric = toNumber(incoming);
        if (numeric !== undefined) {
          nextCurrent = numeric;
        }
      }
    } else if (incoming && typeof incoming === "object") {
      const normalized = parseHealthColumn(incoming);
      if (normalized.current !== undefined) nextCurrent = normalized.current;
      if (normalized.max !== undefined) {
        nextMax = normalized.max;
        maxExplicitlyProvided = true;
      }
    }
  }
  if (payload.maxHealth !== undefined) {
    maxExplicitlyProvided = true;
    const numeric = toNumber(payload.maxHealth);
    if (numeric !== undefined) {
      nextMax = numeric;
    }
  }

  if (computedHealth !== undefined && !healthExplicitlyProvided) {
    nextCurrent = computedHealth;
  }

  if (!maxExplicitlyProvided && computedHealth !== undefined) {
    nextMax = computedHealth;
  }

  if (nextMax !== undefined && nextCurrent > nextMax) {
    nextCurrent = nextMax;
  }

  if (nextCurrent !== undefined) {
    nextCurrent = Math.max(0, Math.round(nextCurrent));
  }
  if (nextMax !== undefined) {
    nextMax = Math.max(nextCurrent ?? 0, Math.round(nextMax));
  }

  const shouldUpdateHealth =
    nextCurrent !== existingCurrent ||
    nextMax !== existingMax ||
    healthExplicitlyProvided ||
    maxExplicitlyProvided ||
    computedHealth !== undefined;

  let healthUpdatePayload = null;
  if (shouldUpdateHealth) {
    healthUpdatePayload = buildHealthPayload(nextCurrent, nextMax);
    fields.push("__HEALTH_COLUMN__ = __HEALTH_PLACEHOLDER__");
    values.push(healthUpdatePayload);
  }
  if (fields.length === 0) {
    return false;
  }
  let resolvedFields = fields;
  if (fields.some((field) => field.includes("__HEALTH_COLUMN__"))) {
    const healthInfo = await resolveHealthColumnInfo();
    if (!healthInfo?.name) {
      throw new Error("AI characters table missing health column");
    }
    resolvedFields = fields.map((field) => {
      if (!field.includes("__HEALTH_COLUMN__")) return field;
      const columnName = healthInfo.name;
      const replacement = healthInfo.isJson ? "CAST(? AS JSON)" : "?";
      return field
        .replace("__HEALTH_COLUMN__", columnName)
        .replace("__HEALTH_PLACEHOLDER__", replacement);
    });
    const index = values.lastIndexOf(healthUpdatePayload);
    if (index !== -1) {
      if (healthInfo.isJson) {
        values[index] = JSON.stringify(healthUpdatePayload ?? {});
      } else {
        const numericValue = Math.round(
          toNumber(healthUpdatePayload?.current) ?? toNumber(nextCurrent) ?? 0
        );
        values[index] = numericValue;
      }
    }
  }
  values.push(characterId);
  const [result] = await pool.query(
    `UPDATE ai_characters SET ${resolvedFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE character_id = ?`,
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
    const rows = await selectCharacterRows(
      (healthColumn) => `
        SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, ${healthColumn} AS health, created_at, updated_at
        FROM ai_characters
        WHERE character_id = ?
        LIMIT 1
      `,
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
    const rows = await selectCharacterRows(
      (healthColumn) => `
        SELECT character_id, user_id, game_id, name, class, level, stats, inventory, avatar, ${healthColumn} AS health, created_at, updated_at
        FROM ai_characters
        WHERE character_id = ?
        LIMIT 1
      `,
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
module.exports.calculateHealth = calculateHealth;
module.exports.resolveHealthColumnInfo = resolveHealthColumnInfo;

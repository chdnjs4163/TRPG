const pool = require("../db");
const { randomUUID } = require("crypto");

const uuid = typeof randomUUID === "function"
  ? randomUUID
  : () => `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

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

  for (const column of HEALTH_COLUMN_CANDIDATES) {
    try {
      await pool.query(`SELECT ${column} FROM ai_characters LIMIT 1`);
      cachedHealthColumnInfo = { name: column, isJson: column !== "health" };
      return cachedHealthColumnInfo;
    } catch (err) {
      if (err?.code !== "ER_BAD_FIELD_ERROR") {
        throw err;
      }
    }
  }
  return null;
}

function normalizeId(value) {
  if (value === undefined || value === null) return null;
  return String(value);
}

function parseJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeJson(value) {
  if (value === undefined) return undefined;
  if (value === null) return "null";
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify(value);
    }
  }
  return JSON.stringify(value);
}

async function ensureGameExists(gameId, { title, genre, difficulty, metadata } = {}) {
  if (!gameId) throw new Error("gameId is required");
  const resolvedTitle = title || `Game ${gameId}`;

  if (title || genre || difficulty || metadata !== undefined) {
    const serializedMetadata = serializeJson(metadata ?? null) ?? "null";
    await pool.query(
      `INSERT INTO ai_games (game_id, title, genre, difficulty, metadata)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         genre = VALUES(genre),
         difficulty = VALUES(difficulty),
         metadata = VALUES(metadata)`,
      [gameId, resolvedTitle, genre || null, difficulty || null, serializedMetadata]
    );
  } else {
    await pool.query(
      `INSERT INTO ai_games (game_id, title)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE game_id = VALUES(game_id)`,
      [gameId, resolvedTitle]
    );
  }
}

async function ensureCharacterExists(characterId, { gameId, userId, name, className, level = 1, stats, inventory, avatar } = {}) {
  const normalizedCharacterId = normalizeId(characterId);
  const normalizedGameId = normalizeId(gameId);
  const normalizedUserId = normalizeId(userId);

  if (!normalizedCharacterId || !normalizedGameId || !normalizedUserId) {
    throw new Error("characterId, gameId, userId are required");
  }

  const [existing] = await pool.query(
    `SELECT character_id FROM ai_characters WHERE character_id = ? LIMIT 1`,
    [normalizedCharacterId]
  );

  if (existing.length > 0) {
    return;
  }

  const serializedStats = serializeJson(stats ?? {});
  const serializedInventory = serializeJson(inventory ?? []);

  await ensureGameExists(normalizedGameId);

  const statsObject = parseJson(serializedStats ?? "{}", {});
  const computedHealth = (() => {
    const base = 100;
    if (!statsObject || typeof statsObject !== "object") return base;
    let total = 0;
    for (const value of Object.values(statsObject)) {
      const num = Number(value);
      if (!Number.isNaN(num)) total += num;
    }
    return Math.round(base + base * (total / 100));
  })();

  try {
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
        normalizedCharacterId,
        normalizedGameId,
        normalizedUserId,
        name || `Character ${normalizedCharacterId}`,
        className || null,
        Number(level) || 1,
        serializedStats ?? "{}",
        serializedInventory ?? "[]",
        avatar || null,
        healthValue,
      ]
    );
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return;
    }
    throw err;
  }
}

module.exports = {
  uuid,
  normalizeId,
  parseJson,
  serializeJson,
  ensureGameExists,
  ensureCharacterExists,
};

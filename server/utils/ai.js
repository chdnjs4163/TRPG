const pool = require("../db");
const { randomUUID } = require("crypto");

const uuid = typeof randomUUID === "function"
  ? randomUUID
  : () => `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

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
    await pool.query(
      `INSERT INTO ai_characters (character_id, game_id, user_id, name, class, level, stats, inventory, avatar, health)
       VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?)`,
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
        computedHealth,
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

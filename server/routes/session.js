const express = require("express");
const router = express.Router();
const pool = require("../db");
const { uuid, normalizeId, ensureGameExists, ensureCharacterExists } = require("../utils/ai");

router.post("/start", async (req, res) => {
  try {
    const { gameId, userId, characterId, sessionId: requestedSessionId } = req.body || {};
    const normalizedGameId = normalizeId(gameId);
    const normalizedUserId = normalizeId(userId);
    const normalizedCharacterId = normalizeId(characterId);

    if (!normalizedGameId || !normalizedUserId || !normalizedCharacterId) {
      return res
        .status(400)
        .json({ error: "Missing required fields: gameId, userId, characterId" });
    }

    const sessionId = normalizeId(requestedSessionId) || uuid();

    await ensureGameExists(normalizedGameId);
    await ensureCharacterExists(normalizedCharacterId, {
      gameId: normalizedGameId,
      userId: normalizedUserId,
    });

    await pool.query(
      `INSERT INTO ai_sessions (session_id, game_id, user_id, character_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         game_id = VALUES(game_id),
         user_id = VALUES(user_id),
         character_id = VALUES(character_id),
         status = 'active',
         ended_at = NULL`,
      [sessionId, normalizedGameId, normalizedUserId, normalizedCharacterId]
    );

    const [results] = await pool.query(
      `SELECT session_id, game_id, user_id, character_id, status, started_at
       FROM ai_sessions
       WHERE session_id = ?
       LIMIT 1`,
      [sessionId]
    );

    if (results.length === 0) {
      return res.status(500).json({ error: "Failed to create session" });
    }

    const row = results[0];
    return res.json({
      sessionId: row.session_id,
      gameId: row.game_id,
      userId: row.user_id,
      characterId: row.character_id,
      status: row.status,
      createdAt: row.started_at,
    });
  } catch (err) {
    console.error("[session/start] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/end", async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    const normalizedSessionId = normalizeId(sessionId);

    if (!normalizedSessionId) {
      return res.status(400).json({ error: "Missing required field: sessionId" });
    }

    const [result] = await pool.query(
      `UPDATE ai_sessions
       SET status = 'ended', ended_at = NOW()
       WHERE session_id = ?`,
      [normalizedSessionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[session/end] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:sessionId", async (req, res) => {
  try {
    const sessionId = normalizeId(req.params.sessionId);

    const [rows] = await pool.query(
      `SELECT session_id, game_id, user_id, character_id, status, started_at, ended_at
       FROM ai_sessions
       WHERE session_id = ?
       LIMIT 1`,
      [sessionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const row = rows[0];
    return res.json({
      sessionId: row.session_id,
      gameId: row.game_id,
      userId: row.user_id,
      characterId: row.character_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      status: row.status,
    });
  } catch (err) {
    console.error("[session/get] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

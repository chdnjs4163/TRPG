const express = require("express");
const router = express.Router();
const pool = require("../db");
const { normalizeId, parseJson, serializeJson } = require("../utils/ai");

const mapConversationRow = (row) => ({
  id: row.id,
  gameId: row.game_id,
  characterId: row.character_id,
  sessionId: row.session_id,
  title: row.title,
  messages: parseJson(row.messages, []),
  updatedAt: row.updated_at,
  createdAt: row.created_at,
});

router.post("/", async (req, res) => {
  try {
    const { game_id, character_id, session_id, title, messages } = req.body || {};

    const gameId = normalizeId(game_id);
    const characterId = normalizeId(character_id);
    const sessionId = session_id ? normalizeId(session_id) : null;

    if (!gameId || !characterId) {
      return res.status(400).json({ error: "game_id와 character_id는 필수입니다." });
    }

    const serializedMessages = serializeJson(messages ?? []) ?? "[]";
    await pool.query(
      `INSERT INTO ai_conversation_logs (game_id, character_id, session_id, title, messages)
       VALUES (?, ?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         session_id = VALUES(session_id),
         title = VALUES(title),
         messages = VALUES(messages),
         updated_at = CURRENT_TIMESTAMP`,
      [gameId, characterId, sessionId, title ? String(title) : null, serializedMessages]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[conversations.post] error:", err);
    res.status(500).json({ error: "대화 저장에 실패했습니다." });
  }
});

router.get("/game/:gameId", async (req, res) => {
  try {
    const gameId = normalizeId(req.params.gameId);
    const characterId = req.query.character_id ? normalizeId(req.query.character_id) : null;

    if (!gameId) {
      return res.status(400).json({ error: "gameId가 필요합니다." });
    }

    const params = [gameId];
    let sql = `SELECT id, game_id, character_id, session_id, title, messages, created_at, updated_at
               FROM ai_conversation_logs
               WHERE game_id = ?`;
    if (characterId) {
      sql += " AND character_id = ?";
      params.push(characterId);
    }
    sql += " ORDER BY updated_at DESC LIMIT 1";

    const [rows] = await pool.query(sql, params);
    if (!rows.length) {
      return res.json(null);
    }

    res.json(mapConversationRow(rows[0]));
  } catch (err) {
    console.error("[conversations.get] error:", err);
    res.status(500).json({ error: "대화 조회에 실패했습니다." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { normalizeId, parseJson, serializeJson } = require("../utils/ai");

async function ensureSessionExists(sessionId) {
  const [rows] = await pool.query(
    "SELECT session_id FROM ai_sessions WHERE session_id = ? LIMIT 1",
    [sessionId]
  );
  return rows.length > 0;
}

async function getProgressPayload(sessionId) {
  const [progressRows] = await pool.query(
    `SELECT session_id, chapter, step, last_message_id
     FROM ai_session_progress
     WHERE session_id = ?
     LIMIT 1`,
    [sessionId]
  );
  const progress = progressRows[0] || {
    session_id: sessionId,
    chapter: 1,
    step: 1,
    last_message_id: null,
  };

  const [checkpointRows] = await pool.query(
    `SELECT checkpoint_key, checkpoint_value, created_at
     FROM ai_progress_checkpoints
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    [sessionId]
  );

  return {
    sessionId,
    chapter: Number(progress.chapter) || 1,
    step: Number(progress.step) || 1,
    lastMessageId: progress.last_message_id || undefined,
    checkpoints: checkpointRows.map((row) => ({
      key: row.checkpoint_key,
      value: parseJson(row.checkpoint_value, null),
      at: row.created_at,
    })),
  };
}

router.get("/:sessionId", async (req, res) => {
  try {
    const sessionId = normalizeId(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }
    const exists = await ensureSessionExists(sessionId);
    if (!exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const payload = await getProgressPayload(sessionId);
    res.json(payload);
  } catch (err) {
    console.error("[progress.get] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:sessionId", async (req, res) => {
  try {
    const sessionId = normalizeId(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const exists = await ensureSessionExists(sessionId);
    if (!exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { chapter, step, checkpoints, lastMessageId } = req.body || {};

    const [existingRows] = await pool.query(
      `SELECT session_id, chapter, step, last_message_id
       FROM ai_session_progress
       WHERE session_id = ?
       LIMIT 1`,
      [sessionId]
    );
    const existing = existingRows[0] || {
      chapter: 1,
      step: 1,
      last_message_id: null,
    };

    const nextChapter =
      chapter !== undefined ? Number(chapter) || 1 : Number(existing.chapter) || 1;
    const nextStep =
      step !== undefined ? Number(step) || 1 : Number(existing.step) || 1;
    const nextLastMessageId =
      lastMessageId !== undefined
        ? normalizeId(lastMessageId)
        : existing.last_message_id;

    await pool.query(
      `INSERT INTO ai_session_progress (session_id, chapter, step, last_message_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         chapter = VALUES(chapter),
         step = VALUES(step),
         last_message_id = VALUES(last_message_id),
         updated_at = CURRENT_TIMESTAMP`,
      [sessionId, nextChapter, nextStep, nextLastMessageId]
    );

    if (Array.isArray(checkpoints)) {
      for (const cp of checkpoints) {
        if (!cp || cp.key === undefined) continue;
        const key = String(cp.key);
        const serializedValue = serializeJson(cp.value ?? null) ?? "null";
        await pool.query(
          `INSERT INTO ai_progress_checkpoints (session_id, checkpoint_key, checkpoint_value)
           VALUES (?, ?, CAST(? AS JSON))
           ON DUPLICATE KEY UPDATE
             checkpoint_value = VALUES(checkpoint_value),
             created_at = CURRENT_TIMESTAMP`,
          [sessionId, key, serializedValue]
        );
      }
    }

    const payload = await getProgressPayload(sessionId);
    res.json(payload);
  } catch (err) {
    console.error("[progress.patch] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:sessionId/checkpoints", async (req, res) => {
  try {
    const sessionId = normalizeId(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }
    const exists = await ensureSessionExists(sessionId);
    if (!exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const { key, value } = req.body || {};
    if (key === undefined) {
      return res.status(400).json({ error: "Missing required field: key" });
    }

    const serializedValue = serializeJson(value ?? null) ?? "null";

    await pool.query(
      `INSERT INTO ai_progress_checkpoints (session_id, checkpoint_key, checkpoint_value)
       VALUES (?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE
         checkpoint_value = VALUES(checkpoint_value),
         created_at = CURRENT_TIMESTAMP`,
      [sessionId, String(key), serializedValue]
    );

    const [rows] = await pool.query(
      `SELECT checkpoint_key, checkpoint_value, created_at
       FROM ai_progress_checkpoints
       WHERE session_id = ? AND checkpoint_key = ?
       LIMIT 1`,
      [sessionId, String(key)]
    );

    const saved = rows[0];

    res.status(201).json({
      key: saved.checkpoint_key,
      value: parseJson(saved.checkpoint_value, null),
      at: saved.created_at,
    });
  } catch (err) {
    console.error("[progress.checkpoints.post] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

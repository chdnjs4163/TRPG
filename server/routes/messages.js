const express = require("express");
const router = express.Router();
const pool = require("../db");
const { normalizeId } = require("../utils/ai");

async function sessionExists(sessionId) {
  const [rows] = await pool.query(
    "SELECT session_id FROM ai_sessions WHERE session_id = ? LIMIT 1",
    [sessionId]
  );
  return rows.length > 0;
}

router.get("/", async (req, res) => {
  try {
    const sessionId = normalizeId(req.query.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "Missing required query parameter: sessionId" });
    }
    const afterId = req.query.afterId ? Number(req.query.afterId) : null;

    const exists = await sessionExists(sessionId);
    if (!exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const params = [sessionId];
    let sql = `SELECT id, role, content, type, created_at
               FROM ai_messages
               WHERE session_id = ?`;
    if (Number.isFinite(afterId) && afterId > 0) {
      sql += " AND id > ?";
      params.push(afterId);
    }
    sql += " ORDER BY id ASC";

    const [rows] = await pool.query(sql, params);
    res.json(
      rows.map((row) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        type: row.type || "chat",
        createdAt: row.created_at,
      }))
    );
  } catch (err) {
    console.error("[messages.get] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { sessionId, role, content, type } = req.body || {};
    const normalizedSessionId = normalizeId(sessionId);
    if (!normalizedSessionId || !role || !content) {
      return res
        .status(400)
        .json({ error: "Missing required fields: sessionId, role, content" });
    }

    const exists = await sessionExists(normalizedSessionId);
    if (!exists) {
      return res.status(404).json({ error: "Session not found" });
    }

    const normalizedRole = ["system", "assistant", "user"].includes(String(role))
      ? String(role)
      : null;
    if (!normalizedRole) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const safeType = ["chat", "dice", "combat"].includes(String(type))
      ? String(type)
      : "chat";

    const [result] = await pool.query(
      `INSERT INTO ai_messages (session_id, role, content, type)
       VALUES (?, ?, ?, ?)`,
      [normalizedSessionId, normalizedRole, String(content), safeType]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("[messages.post] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

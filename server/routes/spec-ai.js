const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  normalizeId,
  ensureGameExists,
  ensureCharacterExists,
} = require("../utils/ai");

const PLACEHOLDER_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function loadSessionContext(sessionId) {
  const [rows] = await pool.query(
    `SELECT s.session_id,
            s.game_id,
            s.user_id,
            s.character_id,
            g.title,
            g.genre,
            g.difficulty,
            c.name AS character_name,
            c.class AS character_class,
            c.level AS character_level
     FROM ai_sessions s
     LEFT JOIN ai_games g ON s.game_id = g.game_id
     LEFT JOIN ai_characters c ON s.character_id = c.character_id
     WHERE s.session_id = ?
     LIMIT 1`,
    [sessionId]
  );
  return rows[0] || null;
}

router.post("/generate-scenario", async (req, res) => {
  try {
    const { sessionId, templateTitle } = req.body || {};
    const normalizedSessionId = normalizeId(sessionId);
    if (!normalizedSessionId) {
      return res.status(400).json({ error: "Missing required field: sessionId" });
    }

    const context = await loadSessionContext(normalizedSessionId);
    if (!context) {
      return res.status(404).json({ error: "Session not found" });
    }

    await ensureGameExists(context.game_id, {
      title: context.title || templateTitle || `Game ${context.game_id}`,
    });
    await ensureCharacterExists(context.character_id, {
      gameId: context.game_id,
      userId: context.user_id,
      name: context.character_name,
      className: context.character_class,
      level: context.character_level,
    });

    const scenarioTitle =
      templateTitle ||
      context.title ||
      `Adventure for ${context.character_name || "Unknown Hero"}`;

    const initialMessage =
      `당신은 ${context.character_name || "모험가"}입니다. ` +
      `${context.genre || "환상"} 장르의 세계에서 새로운 여정을 시작합니다. ` +
      `난이도는 ${context.difficulty || "보통"}입니다. ` +
      `첫 장면에서 주어진 단서를 찾아 앞으로 나아가세요!`;

    res.json({
      gameTitle: scenarioTitle,
      initialMessage,
    });
  } catch (err) {
    console.error("[ai.generate-scenario] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/dialogue", async (req, res) => {
  try {
    const { sessionId, history } = req.body || {};
    const normalizedSessionId = normalizeId(sessionId);
    if (!normalizedSessionId) {
      return res.status(400).json({ error: "Missing required field: sessionId" });
    }

    const context = await loadSessionContext(normalizedSessionId);
    if (!context) {
      return res.status(404).json({ error: "Session not found" });
    }

    const lastUserMessage =
      Array.isArray(history) &&
      [...history]
        .reverse()
        .find((entry) => entry && entry.role === "user" && entry.content)?.content;

    const response = lastUserMessage
      ? `흥미로운 선택이네요! "${lastUserMessage}"에 이어, 주변을 살펴보니 새로운 단서가 눈에 띕니다. 어떻게 하시겠습니까?`
      : "모험을 계속 이어가 볼까요? 원하는 행동을 말씀해주세요.";

    await pool.query(
      `INSERT INTO ai_messages (session_id, role, content, type)
       VALUES (?, 'assistant', ?, 'chat')`,
      [normalizedSessionId, response]
    );

    res.json({
      aiResponse: response,
    });
  } catch (err) {
    console.error("[ai.dialogue] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/image", async (req, res) => {
  try {
    const { sessionId, prompt, size, mime } = req.body || {};
    const normalizedSessionId = normalizeId(sessionId);
    if (!normalizedSessionId) {
      return res.status(400).json({ error: "Missing required field: sessionId" });
    }
    const context = await loadSessionContext(normalizedSessionId);
    if (!context) {
      return res.status(404).json({ error: "Session not found" });
    }

    const safePrompt = prompt ? String(prompt) : "An enigmatic scene unfolds.";
    const safeMime = mime === "image/jpeg" ? "image/jpeg" : "image/png";
    const imageId = `img-${Date.now()}`;

    await pool.query(
      `INSERT INTO ai_messages (session_id, role, content, type)
       VALUES (?, 'assistant', ?, 'chat')`,
      [normalizedSessionId, `[image:${imageId}] ${safePrompt}`]
    );

    res.json({
      id: imageId,
      mime: safeMime,
      data: PLACEHOLDER_IMAGE_BASE64,
      prompt: safePrompt,
      size: size || "512x512",
    });
  } catch (err) {
    console.error("[ai.image] error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

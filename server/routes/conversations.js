const express = require("express");
const router = express.Router();
const pool = require("../db");
const path = require("path");
const fs = require("fs/promises");
const { normalizeId, parseJson, serializeJson, uuid } = require("../utils/ai");

const PUBLIC_CONVERSATION_DIR = path.join(__dirname, "..", "public", "conversations");

const ensureDir = async (targetPath) => {
  await fs.mkdir(targetPath, { recursive: true });
};

const sanitizeName = (value, fallback) => {
  if (!value || typeof value !== "string") return fallback;
  return value.replace(/[^a-zA-Z0-9-_\.]/g, "_");
};

const resolveExtension = (mime, fallback = "png") => {
  if (!mime || typeof mime !== "string") return fallback;
  const match = mime.match(/\/(\w+)/);
  return match ? match[1] : fallback;
};

async function persistImageData(image, gameId, characterId) {
  const url = typeof image.url === "string" && image.url.length > 0 ? image.url : null;
  const inlineData = typeof image.data === "string" && image.data.length > 0 ? image.data : null;
  const dataUrl = typeof image.dataUrl === "string" && image.dataUrl.length > 0 ? image.dataUrl : null;
  let mime = typeof image.mime === "string" && image.mime.length > 0 ? image.mime : null;

  let base64Data = inlineData;
  if (!base64Data && dataUrl && dataUrl.startsWith("data:")) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      mime = mime || match[1];
      base64Data = match[2];
    }
  }

  if (!base64Data && url) {
    return {
      id: image.id || uuid(),
      url,
      mime: mime || null,
      filename: image.filename || null,
    };
  }

  if (!base64Data) {
    return null;
  }

  const safeGameId = sanitizeName(String(gameId), String(gameId));
  const safeCharacterId = sanitizeName(String(characterId), String(characterId));
  const baseDir = path.join(PUBLIC_CONVERSATION_DIR, safeGameId, safeCharacterId);
  await ensureDir(baseDir);

  const extension = resolveExtension(mime, "png");
  const safeFilename = sanitizeName(image.filename, `${image.id || uuid()}.${extension}`);
  const finalFilename = safeFilename.endsWith(`.${extension}`)
    ? safeFilename
    : `${safeFilename}.${extension}`;
  const buffer = Buffer.from(base64Data, "base64");
  const filePath = path.join(baseDir, finalFilename);
  await fs.writeFile(filePath, buffer);

  const publicUrl = `/conversations/${safeGameId}/${safeCharacterId}/${finalFilename}`;

  return {
    id: image.id || uuid(),
    url: publicUrl,
    mime: mime || `image/${extension}`,
    filename: finalFilename,
  };
}

async function transformMessages(messages, gameId, characterId) {
  if (!Array.isArray(messages)) return [];

  const transformed = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") continue;
    const copy = { ...msg };
    if (Array.isArray(msg.images) && msg.images.length > 0) {
      const processedImages = [];
      for (const image of msg.images) {
        if (!image || typeof image !== "object") continue;
        try {
          const saved = await persistImageData(image, gameId, characterId);
          if (saved) {
            processedImages.push(saved);
          }
        } catch (error) {
          console.error("[conversations] 이미지 저장 실패:", error);
        }
      }
      copy.images = processedImages;
    }
    transformed.push(copy);
  }
  return transformed;
}

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
    const rawCharacterId = normalizeId(character_id);
    const sessionId = session_id ? normalizeId(session_id) : null;

    if (!gameId) {
      return res.status(400).json({ error: "game_id는 필수입니다." });
    }

    const [gameRows] = await pool.query(
      `SELECT game_id FROM ai_games WHERE game_id = ? LIMIT 1`,
      [gameId]
    );

    if (!gameRows.length) {
      return res.status(404).json({ error: "게임 정보를 찾을 수 없습니다." });
    }

    let characterId = rawCharacterId;
    if (!characterId) {
      const [legacyCharacters] = await pool.query(
        `SELECT character_id FROM ai_characters WHERE game_id = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1`,
        [gameId]
      );
      if (!legacyCharacters.length) {
        return res.status(400).json({ error: "character_id를 찾을 수 없습니다. 먼저 캐릭터를 생성해주세요." });
      }
      characterId = normalizeId(legacyCharacters[0].character_id);
    }

    const [characterRows] = await pool.query(
      `SELECT character_id FROM ai_characters WHERE character_id = ? AND game_id = ? LIMIT 1`,
      [characterId, gameId]
    );

    if (!characterRows.length) {
      return res.status(404).json({ error: "해당 게임에서 캐릭터를 찾을 수 없습니다." });
    }

    const transformedMessages = await transformMessages(messages ?? [], gameId, characterId);
    const serializedMessages = serializeJson(transformedMessages) ?? "[]";
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
    if (err?.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "유효하지 않은 game_id 또는 character_id 입니다." });
    }
    if (err?.code === "ER_DATA_TOO_LONG" || err?.code === "ER_DATA_OUT_OF_RANGE") {
      return res.status(413).json({ error: "대화 데이터가 너무 큽니다." });
    }
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

router.post("/upload", async (req, res) => {
  try {
    const { game_id, character_id, data, dataUrl, mime, filename } = req.body || {};

    const gameId = normalizeId(game_id);
    if (!gameId) {
      return res.status(400).json({ error: "game_id는 필수입니다." });
    }

    const [gameRows] = await pool.query(
      `SELECT game_id FROM ai_games WHERE game_id = ? LIMIT 1`,
      [gameId]
    );

    if (!gameRows.length) {
      return res.status(404).json({ error: "게임 정보를 찾을 수 없습니다." });
    }

    let characterId = normalizeId(character_id);
    if (!characterId) {
      const [legacyCharacters] = await pool.query(
        `SELECT character_id FROM ai_characters WHERE game_id = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1`,
        [gameId]
      );
      if (!legacyCharacters.length) {
        return res.status(400).json({ error: "character_id를 찾을 수 없습니다. 먼저 캐릭터를 생성해주세요." });
      }
      characterId = normalizeId(legacyCharacters[0].character_id);
    }

    const [characterRows] = await pool.query(
      `SELECT character_id FROM ai_characters WHERE character_id = ? AND game_id = ? LIMIT 1`,
      [characterId, gameId]
    );

    if (!characterRows.length) {
      return res.status(404).json({ error: "해당 게임에서 캐릭터를 찾을 수 없습니다." });
    }

    const payload = {
      id: req.body?.id,
      data,
      dataUrl,
      mime,
      filename,
    };

    const saved = await persistImageData(payload, gameId, characterId);
    if (!saved) {
      return res.status(400).json({ error: "이미지 데이터를 확인할 수 없습니다." });
    }

    res.json(saved);
  } catch (err) {
    console.error("[conversations.upload] error:", err);
    if (err?.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({ error: "유효하지 않은 game_id 또는 character_id 입니다." });
    }
    if (err?.code === "ER_DATA_TOO_LONG" || err?.code === "ER_DATA_OUT_OF_RANGE") {
      return res.status(413).json({ error: "이미지 데이터가 너무 큽니다." });
    }
    res.status(500).json({ error: "이미지 업로드에 실패했습니다." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { success, error } = require("../utils/response");
const { parseScenario, serializeScenario } = require("../utils/scenario");

const mapTitleRow = (row) => ({
  id: row.title_id,
  title: row.title_name,
  description: row.description,
  image: row.thumbnail_url,
  date: row.created_at,
  genre: row.theme,
  scenario: parseScenario(row.scenario_json),
});

async function fetchTitleById(titleId) {
  const [rows] = await pool.query("SELECT * FROM game_titles WHERE title_id = ? LIMIT 1", [titleId]);
  return rows[0] ? mapTitleRow(rows[0]) : null;
}

// 게임 타이틀 목록 조회
router.get("/", async (req, res) => {
  try {
    const { theme, limit } = req.query;
    let query = "SELECT * FROM game_titles";
    const conditions = [];
    const params = [];

    if (theme) {
      conditions.push("theme = ?");
      params.push(theme);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit, 10));
    }

    const [rows] = await pool.query(query, params);
    const formatted = rows.map(mapTitleRow);
    success(res, formatted);
  } catch (err) {
    console.error("[game_titles.list] error:", err);
    error(res, "게임 타이틀 조회 실패");
  }
});

// 게임 타이틀 생성
router.post("/", async (req, res) => {
  try {
    const { title, title_name, description, image, thumbnail_url, genre, theme, scenario, scenario_json } = req.body || {};
    const resolvedTitle = (title ?? title_name)?.trim();
    if (!resolvedTitle) {
      return error(res, "title은 필수입니다.", 400);
    }

    let scenarioPayload;
    try {
      scenarioPayload = serializeScenario(scenario ?? scenario_json);
    } catch (serializeErr) {
      if (serializeErr.message === "INVALID_SCENARIO") {
        return error(res, "scenario는 올바른 JSON 형식이어야 합니다.", 400);
      }
      throw serializeErr;
    }

    const [result] = await pool.query(
      `INSERT INTO game_titles (title_name, description, thumbnail_url, theme, scenario_json, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [resolvedTitle, description ?? null, image ?? thumbnail_url ?? null, genre ?? theme ?? null, scenarioPayload ?? null]
    );

    const created = await fetchTitleById(result.insertId);
    success(res, created, "게임 타이틀 생성 완료");
  } catch (err) {
    console.error("[game_titles.create] error:", err);
    error(res, "게임 타이틀 생성 실패");
  }
});

// 단일 게임 타이틀 조회 (시나리오 포함)
router.get("/:id", async (req, res) => {
  try {
    const item = await fetchTitleById(req.params.id);
    if (!item) {
      return error(res, "존재하지 않는 타이틀", 404);
    }
    success(res, item);
  } catch (err) {
    console.error("[game_titles.get] error:", err);
    error(res, "게임 타이틀 단건 조회 실패");
  }
});

// 게임 타이틀 수정
router.patch("/:id", async (req, res) => {
  try {
    const titleId = req.params.id;
    const { title, title_name, description, image, thumbnail_url, genre, theme, scenario, scenario_json } = req.body || {};

    const fields = [];
    const params = [];

    if (title !== undefined || title_name !== undefined) {
      const resolvedTitle = (title ?? title_name)?.trim();
      if (!resolvedTitle) {
        return error(res, "title은 비워둘 수 없습니다.", 400);
      }
      fields.push("title_name = ?");
      params.push(resolvedTitle);
    }

    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description ?? null);
    }

    if (image !== undefined || thumbnail_url !== undefined) {
      fields.push("thumbnail_url = ?");
      params.push(image ?? thumbnail_url ?? null);
    }

    if (genre !== undefined || theme !== undefined) {
      fields.push("theme = ?");
      params.push(genre ?? theme ?? null);
    }

    if (scenario !== undefined || scenario_json !== undefined) {
      let scenarioPayload;
      try {
        scenarioPayload = serializeScenario(scenario ?? scenario_json);
      } catch (serializeErr) {
        if (serializeErr.message === "INVALID_SCENARIO") {
          return error(res, "scenario는 올바른 JSON 형식이어야 합니다.", 400);
        }
        throw serializeErr;
      }
      fields.push("scenario_json = ?");
      params.push(scenarioPayload ?? null);
    }

    if (fields.length === 0) {
      return error(res, "변경할 필드가 없습니다.", 400);
    }

    params.push(titleId);

    const [result] = await pool.query(
      `UPDATE game_titles SET ${fields.join(", ")} WHERE title_id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return error(res, "존재하지 않는 타이틀", 404);
    }

    const updated = await fetchTitleById(titleId);
    success(res, updated, "게임 타이틀 수정 완료");
  } catch (err) {
    console.error("[game_titles.update] error:", err);
    error(res, "게임 타이틀 수정 실패");
  }
});

// 게임 타이틀 삭제
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM game_titles WHERE title_id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return error(res, "존재하지 않는 타이틀", 404);
    }
    success(res, { ok: true }, "게임 타이틀 삭제 완료");
  } catch (err) {
    console.error("[game_titles.delete] error:", err);
    error(res, "게임 타이틀 삭제 실패");
  }
});

module.exports = router;
module.exports.fetchTitleById = fetchTitleById;
module.exports.mapTitleRow = mapTitleRow;

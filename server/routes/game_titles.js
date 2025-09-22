const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error } = require('../utils/response');

// 게임 타이틀 목록 조회
router.get('/', async (req, res) => {
    try {
        const { theme, limit } = req.query;
        let query = 'SELECT * FROM game_titles';
        const conditions = [];
        const params = [];

        if (theme) {
            conditions.push('theme=?');
            params.push(theme);
        }
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY created_at DESC';
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }

        const [rows] = await pool.query(query, params);
        const formatted = rows.map(r => {
            let scenario = undefined;
            if (r.scenario_json) {
                if (typeof r.scenario_json === 'string') {
                    try { scenario = JSON.parse(r.scenario_json); } catch { scenario = undefined; }
                } else {
                    scenario = r.scenario_json;
                }
            }
            return {
            id: r.title_id,
            title: r.title_name,
            description: r.description,
            image: r.thumbnail_url,
            date: r.created_at,
            genre: r.theme,
            scenario: scenario,
        }});
        success(res, formatted);
    } catch (err) {
        console.error(err);
        error(res, '게임 타이틀 조회 실패');
    }
});

// 단일 게임 타이틀 조회 (시나리오 포함)
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM game_titles WHERE title_id = ?', [req.params.id]);
        if (!rows.length) return error(res, '존재하지 않는 타이틀', 404);
        const r = rows[0];
        let scenario = undefined;
        if (r.scenario_json) {
            if (typeof r.scenario_json === 'string') {
                try { scenario = JSON.parse(r.scenario_json); } catch { scenario = undefined; }
            } else {
                scenario = r.scenario_json;
            }
        }
        const item = {
            id: r.title_id,
            title: r.title_name,
            description: r.description,
            image: r.thumbnail_url,
            date: r.created_at,
            genre: r.theme,
            scenario: scenario,
        };
        success(res, item);
    } catch (err) {
        console.error(err);
        error(res, '게임 타이틀 단건 조회 실패');
    }
});

module.exports = router;

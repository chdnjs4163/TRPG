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
        const formatted = rows.map(r => ({
            id: r.title_id,
            title: r.title_name,
            description: r.description,
            image: r.thumbnail_url,
            date: r.created_at,
        }));
        success(res, formatted);
    } catch (err) {
        console.error(err);
        error(res, '게임 타이틀 조회 실패');
    }
});

module.exports = router;

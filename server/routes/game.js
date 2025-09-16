const express = require('express');
const router = express.Router();
const db = require('../db');
// 게임 타이틀 목록 조회 1
router.get('/', async (req, res) => {  // <-- 여기 /game -> / 로 변경
    try {
        const { recent, template, theme, limit } = req.query;
        let query = 'SELECT * FROM game_titles';
        const conditions = [];
        const params = [];

        if (theme) {
            conditions.push('theme = ?');
            params.push(theme);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';
        if (limit) query += ' LIMIT ?';
        if (limit) params.push(parseInt(limit));

        const [rows] = await db.query(query, params);

        // DB 필드를 프론트에 맞게 매핑
        const formatted = rows.map(row => ({
            id: row.title_id,
            title: row.title_name,
            description: row.description,
            image: row.thumbnail_url,
            date: row.created_at,
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '게임 데이터를 가져오는 중 오류 발생' });
    }
});

module.exports = router;

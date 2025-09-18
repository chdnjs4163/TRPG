const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error } = require('../utils/response');

// 진행도 조회
router.get('/:gameId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM progress WHERE game_id=?', [req.params.gameId]);
        success(res, rows[0] || {});
    } catch (err) {
        console.error(err);
        error(res, '진행도 조회 실패');
    }
});

// 진행도 수정
router.put('/:gameId', async (req, res) => {
    const { chapter, scene, choices } = req.body;
    try {
        await pool.query(
            'UPDATE progress SET chapter=?, scene=?, choices=? WHERE game_id=?',
            [chapter, scene, JSON.stringify(choices), req.params.gameId]
        );
        success(res, null, '진행도 업데이트 완료');
    } catch (err) {
        console.error(err);
        error(res, '진행도 업데이트 실패');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error } = require('../utils/response');

// 유저별 게임 슬롯 조회
router.get('/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM games WHERE user_id=?', [req.params.userId]);
        success(res, rows);
    } catch (err) {
        console.error(err);
        error(res, '게임 슬롯 조회 실패');
    }
});

// 게임 슬롯 수정
router.put('/:gameId', async (req, res) => {
    const { status, last_played } = req.body;
    try {
        await pool.query('UPDATE games SET status=?, last_played=? WHERE game_id=?', [status, last_played, req.params.gameId]);
        success(res, null, '게임 슬롯 업데이트 완료');
    } catch (err) {
        console.error(err);
        error(res, '게임 슬롯 업데이트 실패');
    }
});

module.exports = router;

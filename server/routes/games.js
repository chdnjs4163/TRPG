const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error } = require('../utils/response');

// 유저별 게임 슬롯 조회
router.get('/user/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                g.game_id AS id,
                gt.title_name AS title,
                gt.thumbnail_url AS image,
                g.last_played AS date,
                g.status,
                g.title_id
             FROM games g
             JOIN game_titles gt ON g.title_id = gt.title_id
             WHERE g.user_id = ?
             ORDER BY g.last_played DESC`,
            [req.params.userId]
        );
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

// 특정 사용자와 타이틀로 최근 슬롯 조회
router.get('/find', async (req, res) => {
    try {
        const { user_id, title_id } = req.query;
        if (!user_id || !title_id) return error(res, 'user_id, title_id가 필요합니다.', 400);
        const [rows] = await pool.query(
            `SELECT 
                g.game_id AS id,
                gt.title_name AS title,
                gt.thumbnail_url AS image,
                g.last_played AS date,
                g.status,
                g.title_id
             FROM games g
             JOIN game_titles gt ON g.title_id = gt.title_id
             WHERE g.user_id = ? AND g.title_id = ?
             ORDER BY g.last_played DESC
             LIMIT 1`,
            [user_id, title_id]
        );
        success(res, rows[0] || null);
    } catch (err) {
        console.error(err);
        error(res, '게임 슬롯 조회 실패');
    }
});

// 게임 슬롯 생성
router.post('/', async (req, res) => {
    const { user_id, title_id, slot_number = 1, status = 'ongoing' } = req.body;
    try {
        if (!user_id || !title_id) return error(res, 'user_id, title_id는 필수입니다.', 400);
        const [result] = await pool.query(
            'INSERT INTO games (user_id, title_id, slot_number, status, last_played) VALUES (?, ?, ?, ?, NOW())',
            [user_id, title_id, slot_number, status]
        );
        const [rows] = await pool.query(
            `SELECT 
                g.game_id AS id,
                gt.title_name AS title,
                gt.thumbnail_url AS image,
                g.last_played AS date,
                g.status,
                g.title_id
             FROM games g
             JOIN game_titles gt ON g.title_id = gt.title_id
             WHERE g.game_id = ?
             LIMIT 1`,
            [result.insertId]
        );
        success(res, rows[0], '게임 슬롯 생성 완료');
    } catch (err) {
        console.error(err);
        error(res, '게임 슬롯 생성 실패');
    }
});

module.exports = router;

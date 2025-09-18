const express = require('express');
const router = express.Router();
const pool = require('../db');
const { success, error } = require('../utils/response');

// 1️⃣ 특정 게임의 캐릭터 조회
router.get('/game/:gameId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM characters WHERE game_id=?',
            [req.params.gameId]
        );
        success(res, rows);
    } catch (err) {
        console.error('캐릭터 조회 오류:', err);
        error(res, '캐릭터 조회 실패');
    }
});

// 2️⃣ 캐릭터 생성
router.post('/', async (req, res) => {
    const { game_id, name, class: charClass, level, stats, inventory } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO characters (game_id, name, class, level, stats, inventory) VALUES (?, ?, ?, ?, ?, ?)',
            [game_id, name, charClass, level || 1, JSON.stringify(stats || {}), JSON.stringify(inventory || [])]
        );
        success(res, { character_id: result.insertId }, '캐릭터 생성 완료');
    } catch (err) {
        console.error('캐릭터 생성 오류:', err);
        error(res, '캐릭터 생성 실패');
    }
});

// 3️⃣ 캐릭터 수정
router.put('/:characterId', async (req, res) => {
    const { name, class: charClass, level, stats, inventory } = req.body;
    try {
        await pool.query(
            'UPDATE characters SET name=?, class=?, level=?, stats=?, inventory=? WHERE character_id=?',
            [name, charClass, level, JSON.stringify(stats), JSON.stringify(inventory), req.params.characterId]
        );
        success(res, null, '캐릭터 업데이트 완료');
    } catch (err) {
        console.error('캐릭터 수정 오류:', err);
        error(res, '캐릭터 업데이트 실패');
    }
});

// 4️⃣ 캐릭터 삭제
router.delete('/:characterId', async (req, res) => {
    try {
        await pool.query('DELETE FROM characters WHERE character_id=?', [req.params.characterId]);
        success(res, null, '캐릭터 삭제 완료');
    } catch (err) {
        console.error('캐릭터 삭제 오류:', err);
        error(res, '캐릭터 삭제 실패');
    }
});

// 5️⃣ 캐릭터 단일 조회
router.get('/detail/:characterId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM characters WHERE character_id=?',
            [req.params.characterId]
        );
        if (!rows.length) return error(res, '캐릭터를 찾을 수 없음', 404);
        success(res, rows[0]);
    } catch (err) {
        console.error('캐릭터 상세 조회 오류:', err);
        error(res, '캐릭터 상세 조회 실패');
    }
});

module.exports = router;

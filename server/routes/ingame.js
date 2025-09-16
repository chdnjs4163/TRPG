const express = require("express");
const router = express.Router();
const pool = require("../db");

/* ==========================
   1. Games (세이브 슬롯)
========================== */

// 유저별 세이브 슬롯 조회
router.get("/games/:userId", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT *   FROM games WHERE user_id = ?",
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 게임 슬롯 수정
router.put("/games/:gameId", async (req, res) => {
    const { status, last_played } = req.body;
    try {
        await pool.query(
            "UPDATE games SET status = ?, last_played = ? WHERE game_id = ?",
            [status, last_played, req.params.gameId]
        );
        res.json({ message: "게임 슬롯 업데이트 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================
   2. Characters (캐릭터)
========================== */

// 특정 게임 슬롯 캐릭터 조회
router.get("/characters/:gameId", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM characters WHERE game_id = ?",
            [req.params.gameId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 캐릭터 수정
router.put("/characters/:characterId", async (req, res) => {
    const { name, class: charClass, level, stats, inventory } = req.body;
    try {
        await pool.query(
            "UPDATE characters SET name=?, class=?, level=?, stats=?, inventory=? WHERE character_id=?",
            [
                name,
                charClass,
                level,
                JSON.stringify(stats),
                JSON.stringify(inventory),
                req.params.characterId,
            ]
        );
        res.json({ message: "캐릭터 업데이트 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ==========================
   3. Progress (진행도)
========================== */

// 진행도 조회
router.get("/progress/:gameId", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM progress WHERE game_id = ?",
            [req.params.gameId]
        );
        res.json(rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 진행도 수정
router.put("/progress/:gameId", async (req, res) => {
    const { chapter, scene, choices } = req.body;
    try {
        await pool.query(
            "UPDATE progress SET chapter=?, scene=?, choices=? WHERE game_id=?",
            [chapter, scene, JSON.stringify(choices), req.params.gameId]
        );
        res.json({ message: "진행도 업데이트 완료" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

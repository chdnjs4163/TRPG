const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/games', require('./games'));
router.use('/characters', require('./characters'));
router.use('/progress', require('./progress'));
router.use('/game_titles', require('./game_titles'));
router.use('/auth', require('./auth'));

module.exports = router;

const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/session", require("./session"));
router.use("/games", require("./games"));
router.use("/characters", require("./characters"));
router.use("/progress", require("./progress"));
router.use("/messages", require("./messages"));
router.use("/ai", require("./spec-ai"));
router.use("/game_titles", require("./game_titles"));

module.exports = router;

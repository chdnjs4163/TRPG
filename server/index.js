// Description: Main server file for TRPG API with authentication and game route
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game"); // 게임 API 라우터

dotenv.config();
const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: false }));
app.use(express.json());

// 기본 health check
app.get("/", (req, res) => res.json({ ok: true, service: "TRPG API" }));

// 인증 관련 라우터
app.use("/api/auth", authRoutes);

// 게임 관련 라우터
app.use("/api/game", gameRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

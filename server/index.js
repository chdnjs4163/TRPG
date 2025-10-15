const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { ensureCoreTables } = require("./utils/db-init");

dotenv.config();
const app = express();

// CORS 설정
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get("/", (req, res) => res.json({ ok: true, service: "TRPG API" }));

// 모든 라우터 통합
app.use("/api", require("./routes"));

// 서버 시작
const PORT = process.env.PORT || 1024;

async function bootstrap() {
  try {
    await ensureCoreTables();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://192.168.26.165:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize database tables:", err);
    process.exit(1);
  }
}

bootstrap();

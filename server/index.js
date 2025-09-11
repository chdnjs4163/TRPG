const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();
const app = express();

app.use(cors({ origin: ["http://localhost:3000"], credentials: false }));
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true, service: "TRPG Auth API" }));
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

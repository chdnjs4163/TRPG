const express = require("express"); // Express 모듈 불러오기
const bcrypt = require("bcrypt"); // 비밀번호 해싱 모듈
const jwt = require("jsonwebtoken"); // JWT 생성/검증 모듈
const nodemailer = require("nodemailer"); // 이메일 발송 모듈
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db"); // MySQL 연결 풀 (DB 연결)

// Express 라우터 생성
const router = express.Router();

const avatarUploadDir = path.join(__dirname, "..", "public", "uploads", "avatars");
fs.mkdirSync(avatarUploadDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, avatarUploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path.extname(file.originalname) || ".png";
        cb(null, `${uniqueSuffix}${extension}`);
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            cb(new Error("이미지 파일만 업로드할 수 있습니다."));
            return;
        }
        cb(null, true);
    },
});

// --- In-memory 이메일 인증 코드 저장소 ---
// { email: { code: '123456', expiresAt: 1234567890 } }
const emailCodes = new Map();

// 이메일 인증 코드 저장 함수 (TTL = 10분 기본)
function setEmailCode(email, code, ttlMs = 10 * 60 * 1000) {
    emailCodes.set(email, { code, expiresAt: Date.now() + ttlMs });
}

// 이메일 인증 코드 검증 함수
function verifyEmailCode(email, code) {
    const item = emailCodes.get(email); // 저장된 코드 가져오기
    if (!item) return false; // 코드가 없으면 false
    const ok = item.code === code && Date.now() <= item.expiresAt; // 일치 여부 + 만료 체크
    if (ok) emailCodes.delete(email); // 검증 성공 시 1회 사용 후 삭제
    return ok;
}

// --- Helper functions ---
// 이메일로 사용자 조회
async function findUserByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
}

// 사용자 이름으로 사용자 조회
async function findUserByUsername(username) {
    const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
    return rows[0];
}

// 닉네임으로 사용자 조회
async function findUserByNickname(nickname) {
    const [rows] = await pool.query("SELECT * FROM users WHERE nickname = ?", [nickname]);
    return rows[0];
}

// --- Nodemailer 설정 ---
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER, // Gmail 계정
        pass: process.env.MAIL_PASS, // 앱 비밀번호
    },
});

// --- Routes ---

// 회원가입
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "필수 항목 누락" });
        }
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) return res.status(409).json({ error: "이미 사용 중인 이메일" });
        const existingUser = await findUserByUsername(username);
        if (existingUser) return res.status(409).json({ error: "이미 사용 중인 사용자 이름" });

        const hashedPassword = await bcrypt.hash(password, 10); // 비밀번호 해싱
        await pool.query(
            "INSERT INTO users (username, email, password_hash, nickname) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, username]
        );
        res.json({ message: "회원가입 성공" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "회원가입 실패" });
    }
});

// 로그인 (이메일 + 비밀번호)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ error: "이메일 없음" });

        const ok = await bcrypt.compare(password, user.password_hash); // 비밀번호 검증
        if (!ok) return res.status(400).json({ error: "비밀번호 불일치" });

        // JWT 발급 (1시간 만료)
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || "secret",
            { expiresIn: "1h" }
        );

        res.json({
            message: "로그인 성공",
            userId: user.id, // 추가
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "로그인 실패" });
    }
});

// 비밀번호 변경 (토큰 기반)
router.post("/change-password", authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "비밀번호 정보를 입력해주세요." });
        }

        const user = await findUserByEmail(req.user.email);
        if (!user) return res.status(404).json({ error: "사용자 없음" });

        const ok = await bcrypt.compare(oldPassword, user.password_hash); // 기존 비밀번호 검증
        if (!ok) return res.status(401).json({ error: "기존 비밀번호 불일치" });

        const newHash = await bcrypt.hash(newPassword, 10); // 새 비밀번호 해싱
        await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id]);
        res.json({ message: "비밀번호 변경 성공" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "비밀번호 변경 실패" });
    }
});

// 닉네임 중복 확인
router.post("/check-nickname", authenticateToken, async (req, res) => {
    try {
        const { nickname } = req.body;
        if (!nickname || typeof nickname !== "string" || nickname.trim().length === 0) {
            return res.status(400).json({ error: "닉네임을 입력해주세요." });
        }

        const existing = await findUserByNickname(nickname.trim());
        if (existing && existing.id !== req.user.id) {
            return res.json({ available: false });
        }
        return res.json({ available: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "닉네임 확인 실패" });
    }
});

router.post("/profile/avatar", authenticateToken, (req, res) => {
    avatarUpload.single("avatar")(req, res, async (err) => {
        if (err) {
            console.error("프로필 이미지 업로드 실패:", err);
            return res.status(400).json({ error: err.message || "이미지 업로드에 실패했습니다." });
        }

        if (!req.file) {
            return res.status(400).json({ error: "업로드된 파일이 없습니다." });
        }

        try {
            const relativePath = path.posix.join("uploads", "avatars", req.file.filename);
            const normalizedPath = relativePath.replace(/\\/g, "/");
            const host = req.get("host");
            if (!host) {
                throw new Error("호스트 정보를 확인할 수 없습니다.");
            }
            const publicUrl = `${req.protocol}://${host}/${normalizedPath}`;

            await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [publicUrl, req.user.id]);

            res.json({
                message: "프로필 이미지가 업로드되었습니다.",
                avatarUrl: publicUrl,
                path: `/${normalizedPath}`,
            });
        } catch (uploadError) {
            console.error("프로필 이미지 저장 실패:", uploadError);
            res.status(500).json({ error: "프로필 이미지 저장 중 오류가 발생했습니다." });
        }
    });
});

// 프로필 업데이트
router.put("/profile", authenticateToken, async (req, res) => {
    try {
        const { nickname, avatarUrl, bio } = req.body || {};

        const updates = [];
        const values = [];

        if (nickname !== undefined) {
            const trimmed = typeof nickname === "string" ? nickname.trim() : "";
            if (trimmed.length === 0) {
                return res.status(400).json({ error: "닉네임을 입력해주세요." });
            }
            const existing = await findUserByNickname(trimmed);
            if (existing && existing.id !== req.user.id) {
                return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
            }
            updates.push("nickname = ?");
            values.push(trimmed);
        }

        if (avatarUrl !== undefined) {
            updates.push("avatar_url = ?");
            values.push(avatarUrl ? String(avatarUrl) : null);
        }

        if (bio !== undefined) {
            updates.push("bio = ?");
            values.push(bio ? String(bio) : null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "업데이트할 항목이 없습니다." });
        }

        values.push(req.user.id);
        const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
        await pool.query(sql, values);

        const [rows] = await pool.query("SELECT id, username, email, nickname, avatar_url, bio FROM users WHERE id = ?", [req.user.id]);
        const updated = rows[0];
        if (!updated) {
            return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }
        res.json({ message: "프로필이 업데이트되었습니다.", profile: {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            nickname: updated.nickname,
            avatarUrl: updated.avatar_url,
            bio: updated.bio,
        }});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "프로필 업데이트 실패" });
    }
});

// 이메일 인증 코드 발송
router.post("/send-email-code", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "이메일을 입력하세요" });
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ error: "가입되지 않은 이메일" });

        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 코드 생성
        setEmailCode(email, code); // 메모리에 저장

        // 이메일 발송
        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: "[TRPG 플랫폼] 비밀번호 재설정 인증코드",
            text: `인증코드: ${code} (10분 내 유효)`,
        });

        res.json({ message: "인증코드를 이메일로 발송했습니다." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "이메일 발송 실패" });
    }
});

// 이메일 인증 코드 검증
router.post("/verify-email-code", async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: "이메일/코드 누락" });

        const ok = verifyEmailCode(email, code); // 코드 검증
        if (!ok) return res.status(400).json({ error: "인증코드가 올바르지 않거나 만료됨" });

        res.json({ message: "인증 성공" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "인증 처리 실패" });
    }
});

// 비밀번호 재설정 (임시 비밀번호 발급)
router.post("/reset-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await findUserByEmail(email);
        if (!user) return res.status(404).json({ error: "사용자 없음" });

        const tempPassword = Math.random().toString(36).slice(-8); // 임시 비밀번호 생성
        const tempHash = await bcrypt.hash(tempPassword, 10); // 해싱
        await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [tempHash, user.id]);

        // 주의: 실제 배포 시 이메일로 보내야 하며, 여기서는 바로 반환
        res.json({ message: "임시 비밀번호 발급", tempPassword });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "비밀번호 재설정 실패" });
    }
});

// --- Helper function ---
async function findUserByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
}

// --- JWT 검증 미들웨어 ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) return res.sendStatus(401); // 토큰 없으면 인증 실패

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.sendStatus(403); // 토큰 검증 실패
        req.user = user; // req.user에 JWT 정보 저장
        next();
    });
}

// --- 로그인 상태 확인 엔드포인트 ---
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await findUserByEmail(req.user.email);
        if (!user) return res.status(404).json({ error: "사용자 없음" });

        // 필요한 사용자 정보만 반환
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            nickname: user.nickname,
            avatarUrl: user.avatar_url,
            bio: user.bio,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "사용자 정보 조회 실패" });
    }
});

// 라우터 내보내기
module.exports = router;

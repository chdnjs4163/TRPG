-- ============================================================
-- TRPG 서비스 DB 핵심 구조
-- - 실제 코드에서 사용 중인 테이블만 정리
-- - 구분: 기본 인증/마스터, AI 세션 관련
-- ============================================================

-- 1. 기본 인증 및 마스터 데이터 (기존 레거시 슬롯 시스템)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_titles (
  title_id INT AUTO_INCREMENT PRIMARY KEY,
  title_name VARCHAR(100) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(255),
  theme VARCHAR(50) DEFAULT 'default',
  scenario_json JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
  game_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title_id INT NOT NULL,
  slot_number INT DEFAULT 1,
  status ENUM('ongoing','finished') DEFAULT 'ongoing',
  last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (title_id) REFERENCES game_titles(title_id) ON DELETE CASCADE
);

CREATE TABLE characters (
  character_id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  class VARCHAR(50),
  level INT DEFAULT 1,
  stats JSON,
  inventory JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- 2. AI 세션 중심 신규 구조 (현재 메인 플로우)
CREATE TABLE ai_games (
  game_id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(100) NULL,
  difficulty VARCHAR(50) NULL,
  metadata JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE ai_characters (
  character_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(100) NULL,
  level INT DEFAULT 1,
  stats JSON NULL,
  inventory JSON NULL,
  avatar VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_characters_game
    FOREIGN KEY (game_id) REFERENCES ai_games(game_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ai_sessions (
  session_id VARCHAR(64) PRIMARY KEY,
  game_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  character_id VARCHAR(64) NOT NULL,
  status ENUM('active','ended') DEFAULT 'active',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  CONSTRAINT fk_ai_sessions_game
    FOREIGN KEY (game_id) REFERENCES ai_games(game_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ai_sessions_character
    FOREIGN KEY (character_id) REFERENCES ai_characters(character_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ai_session_progress (
  session_id VARCHAR(64) PRIMARY KEY,
  chapter INT DEFAULT 1,
  step INT DEFAULT 1,
  last_message_id VARCHAR(64) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_session_progress_session
    FOREIGN KEY (session_id) REFERENCES ai_sessions(session_id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE ai_progress_checkpoints (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  checkpoint_key VARCHAR(191) NOT NULL,
  checkpoint_value JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_progress_checkpoints_session
    FOREIGN KEY (session_id) REFERENCES ai_sessions(session_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_ai_progress_checkpoints_session (session_id),
  UNIQUE KEY uq_ai_progress_checkpoints (session_id, checkpoint_key)
);

CREATE TABLE ai_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  role ENUM('system','assistant','user') NOT NULL,
  content TEXT NOT NULL,
  type ENUM('chat','dice','combat') DEFAULT 'chat',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_messages_session
    FOREIGN KEY (session_id) REFERENCES ai_sessions(session_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_ai_messages_session (session_id, id)
);

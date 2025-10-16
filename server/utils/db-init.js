const pool = require("../db");

const GAMES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ai_games (
    game_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NULL,
    difficulty VARCHAR(50) NULL,
    metadata JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const CHARACTERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ai_characters (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const SESSION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ai_sessions (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const SESSION_PROGRESS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ai_session_progress (
    session_id VARCHAR(64) PRIMARY KEY,
    chapter INT DEFAULT 1,
    step INT DEFAULT 1,
    last_message_id VARCHAR(64) NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_session_progress_session
      FOREIGN KEY (session_id) REFERENCES ai_sessions(session_id)
      ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const CHECKPOINTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ai_progress_checkpoints (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const CONVERSATION_LOGS_SQL = `
  CREATE TABLE IF NOT EXISTS ai_conversation_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(64) NOT NULL,
    character_id VARCHAR(64) NOT NULL,
    session_id VARCHAR(64) NULL,
    title VARCHAR(255) NULL,
    messages JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ai_conversation_logs_game
      FOREIGN KEY (game_id) REFERENCES ai_games(game_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ai_conversation_logs_character
      FOREIGN KEY (character_id) REFERENCES ai_characters(character_id)
      ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_conversation_game (game_id),
    INDEX idx_conversation_character (character_id),
    UNIQUE KEY uq_conversation_game_character (game_id, character_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const MESSAGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS ai_messages (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function ensureCoreTables() {
  const statements = [
    GAMES_TABLE_SQL,
    CHARACTERS_TABLE_SQL,
    SESSION_TABLE_SQL,
    SESSION_PROGRESS_TABLE_SQL,
    CHECKPOINTS_TABLE_SQL,
    CONVERSATION_LOGS_SQL,
    MESSAGES_TABLE_SQL,
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }
}

module.exports = { ensureCoreTables };

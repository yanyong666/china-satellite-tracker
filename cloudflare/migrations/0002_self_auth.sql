-- 无卡自有会员认证：仅存不可逆密码哈希、随机盐和会话摘要，不存明文密码。

ALTER TABLE members ADD COLUMN password_hash TEXT;
ALTER TABLE members ADD COLUMN password_salt TEXT;
ALTER TABLE members ADD COLUMN session_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (email) REFERENCES members(email) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS member_sessions_email_idx ON member_sessions(email);
CREATE INDEX IF NOT EXISTS member_sessions_expiry_idx ON member_sessions(expires_at);

CREATE TABLE IF NOT EXISTS member_login_locks (
  email TEXT PRIMARY KEY NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  locked_until INTEGER
);

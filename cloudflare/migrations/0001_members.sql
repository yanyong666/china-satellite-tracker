-- stock-terminal Workers D1 schema
-- Apply in the Cloudflare D1 console after the MEMBER_DB binding is connected.

CREATE TABLE IF NOT EXISTS members (
  email TEXT PRIMARY KEY NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS saved_stocks (
  email TEXT NOT NULL,
  stock_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (email, stock_id),
  FOREIGN KEY (email) REFERENCES members(email) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS saved_stocks_email_created_at_idx
  ON saved_stocks(email, created_at DESC);

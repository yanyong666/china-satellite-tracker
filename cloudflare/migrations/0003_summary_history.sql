-- 持久化由公开新闻、市场情绪与 AI/规则引擎生成的每日市场总结。
-- date 使用北京时间的业务日期（YYYY-MM-DD），由 Worker 生成并写入。

CREATE TABLE IF NOT EXISTS daily_market_summaries (
  summary_date TEXT PRIMARY KEY NOT NULL,
  summary_text TEXT NOT NULL,
  key_theme TEXT NOT NULL,
  sector_mover TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('live', 'fallback')),
  model TEXT NOT NULL,
  generated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS daily_market_summaries_generated_idx
  ON daily_market_summaries(generated_at DESC);

-- F1 SNS 定型文キャッシュテーブル（Supabase 無料枠で利用）
CREATE TABLE IF NOT EXISTS f1_sns_cache (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  round INTEGER NOT NULL,
  template_type TEXT NOT NULL,
  grand_prix TEXT NOT NULL,
  session_label TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  text_output TEXT NOT NULL DEFAULT '',
  provider TEXT NOT NULL DEFAULT 'jolpica',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year, round, template_type)
);

CREATE INDEX IF NOT EXISTS idx_f1_sns_cache_year_round ON f1_sns_cache (year, round);

ALTER TABLE f1_sns_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read f1_sns_cache"
  ON f1_sns_cache FOR SELECT
  USING (true);

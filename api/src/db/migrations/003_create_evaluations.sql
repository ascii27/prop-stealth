CREATE TABLE IF NOT EXISTS evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id       UUID REFERENCES properties(id) ON DELETE SET NULL,
  applicant_name    VARCHAR(255) NOT NULL,
  property_address  VARCHAR(255) NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'evaluating'
                    CHECK (status IN ('evaluating', 'complete', 'approved', 'declined')),
  overall_score     INTEGER,
  risk_level        VARCHAR(10) CHECK (risk_level IN ('low', 'medium', 'high')),
  recommendation    TEXT,
  summary           TEXT,
  breakdown         JSONB DEFAULT '[]',
  evidence          JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);

-- Agent run log (shared across all agents)
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error')),
  summary TEXT,
  actions INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);

-- Gmail connections (one per user)
CREATE TABLE IF NOT EXISTS gmail_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  gmail_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  label VARCHAR(100) DEFAULT 'PropStealth',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbox emails (classified by the inbox agent)
CREATE TABLE IF NOT EXISTS inbox_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  gmail_message_id VARCHAR(255) NOT NULL UNIQUE,
  sender VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  theme VARCHAR(20) NOT NULL CHECK (theme IN ('tenant', 'hoa', 'bill', 'maintenance', 'other')),
  key_points TEXT,
  full_content TEXT,
  show_auto_respond BOOLEAN DEFAULT false,
  violation_tag VARCHAR(100),
  email_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_emails_user_id ON inbox_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_emails_property_id ON inbox_emails(property_id);

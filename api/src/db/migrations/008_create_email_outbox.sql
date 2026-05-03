CREATE TABLE IF NOT EXISTS email_outbox (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email        VARCHAR(255) NOT NULL,
  to_user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  subject         VARCHAR(500) NOT NULL,
  body_html       TEXT NOT NULL,
  body_text       TEXT NOT NULL,
  template_key    VARCHAR(80) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbox_status_created_at
  ON email_outbox(status, created_at)
  WHERE status = 'pending';

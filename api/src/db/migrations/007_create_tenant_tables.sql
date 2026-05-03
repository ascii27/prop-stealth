CREATE TABLE IF NOT EXISTS tenants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id           UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by_agent_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status                VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','evaluating','ready','shared','approved','rejected')),
  applicant_name        VARCHAR(255),
  email                 VARCHAR(255),
  phone                 VARCHAR(50),
  employer              VARCHAR(255),
  monthly_income        NUMERIC,
  move_in_date          DATE,
  notes                 TEXT,
  shared_at             TIMESTAMPTZ,
  decided_at            TIMESTAMPTZ,
  decision_by_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  decision_note         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by_agent_id ON tenants(created_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

CREATE TABLE IF NOT EXISTS tenant_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category              VARCHAR(20) NOT NULL
                        CHECK (category IN ('application','id','income','credit','reference','other')),
  filename              VARCHAR(255) NOT NULL,
  storage_key           VARCHAR(512) NOT NULL,
  mime_type             VARCHAR(100) NOT NULL,
  size_bytes            BIGINT NOT NULL,
  uploaded_by_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_documents_tenant_id ON tenant_documents(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_evaluations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status            VARCHAR(20) NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','complete','failed')),
  overall_score     INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  recommendation    VARCHAR(20) CHECK (recommendation IN ('low_risk','review','high_risk')),
  category_scores   JSONB,
  summary           TEXT,
  concerns          JSONB DEFAULT '[]'::jsonb,
  verified_facts    JSONB DEFAULT '[]'::jsonb,
  model_used        VARCHAR(100),
  error             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenant_evaluations_tenant_id ON tenant_evaluations(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_thread_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type              VARCHAR(20) NOT NULL
                    CHECK (type IN ('message','shared','unshared','approved','rejected','reopened')),
  author_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body              TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_thread_events_tenant_id ON tenant_thread_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_thread_events_created_at ON tenant_thread_events(created_at);

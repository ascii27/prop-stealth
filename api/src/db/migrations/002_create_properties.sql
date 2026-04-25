CREATE TABLE IF NOT EXISTS properties (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address       VARCHAR(255) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(2) NOT NULL,
  beds          INTEGER NOT NULL DEFAULT 0,
  baths         INTEGER NOT NULL DEFAULT 0,
  unit          VARCHAR(50),
  occupied      BOOLEAN NOT NULL DEFAULT false,
  tenant_name   VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_user_id ON properties(user_id);

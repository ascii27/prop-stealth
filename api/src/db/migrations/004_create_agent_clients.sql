CREATE TABLE IF NOT EXISTS agent_clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, owner_id)
);

CREATE INDEX idx_agent_clients_agent_id ON agent_clients(agent_id);
CREATE INDEX idx_agent_clients_owner_id ON agent_clients(owner_id);

CREATE TABLE IF NOT EXISTS invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  message       TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_agent_id ON invitations(agent_id);
CREATE INDEX idx_invitations_email ON invitations(email);

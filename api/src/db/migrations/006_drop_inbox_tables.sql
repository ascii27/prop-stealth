-- Drop tables that are no longer used
DROP TABLE IF EXISTS inbox_emails;
DROP TABLE IF EXISTS gmail_connections;
DROP TABLE IF EXISTS agent_runs;
DROP TABLE IF EXISTS evaluations;

-- Invite-token columns on the existing invitations table
ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_consumed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invitations_invite_token ON invitations(invite_token);

-- Properties refactor:
-- 1. Rename user_id → owner_id
-- 2. Drop unit, occupied, tenant_name
-- 3. Add created_by_agent_id, zip, property_type, monthly_rent_target, notes
ALTER TABLE properties RENAME COLUMN user_id TO owner_id;

ALTER TABLE properties
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS occupied,
  DROP COLUMN IF EXISTS tenant_name;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS created_by_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zip VARCHAR(10),
  ADD COLUMN IF NOT EXISTS property_type VARCHAR(40),
  ADD COLUMN IF NOT EXISTS monthly_rent_target NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Replace the old user_id index name
DROP INDEX IF EXISTS idx_properties_user_id;
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_by_agent_id ON properties(created_by_agent_id);

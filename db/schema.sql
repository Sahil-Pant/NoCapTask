-- NoCapTask workspace persistence. Apply with: psql "$DATABASE_URL" -f db/schema.sql
CREATE TABLE IF NOT EXISTS workspace_snapshots (
  workspace_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared team collaboration. These tables are separate from the private
-- workspace snapshot so invitation authorization can be enforced server-side.
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_memberships (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Owner', 'Admin', 'Member')),
  display_name TEXT,
  email TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
CREATE INDEX IF NOT EXISTS team_memberships_user_id_idx ON team_memberships(user_id);

CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_email TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('EMAIL', 'LINK')),
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Member')),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED', 'FAILED')) DEFAULT 'PENDING',
  invited_by_user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 100 CHECK (max_uses > 0),
  uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  delivery_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS team_invitations_team_id_idx ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS team_invitations_pending_email_idx ON team_invitations(team_id, invited_email) WHERE status = 'PENDING';

-- API Keys table for external integration authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash of the key
  key_prefix VARCHAR(12) NOT NULL,        -- First 8 chars for identification (e.g., "fhk_abc123")
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Index for fast key lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- Integrations settings table
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(50) PRIMARY KEY,             -- e.g., 'nintex', 'make', 'zapier'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),                        -- Icon name for UI
  documentation_url TEXT,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',               -- Integration-specific configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default integrations
INSERT INTO integrations (id, name, description, icon, documentation_url, is_enabled) VALUES
  ('nintex', 'Nintex Workflow Cloud', 'Enterprise workflow automation platform with Xtension support', 'workflow', 'https://help.nintex.com/en-US/xtensions/Home.htm', false),
  ('make', 'Make (Integromat)', 'Visual automation platform for connecting apps and services', 'zap', 'https://www.make.com/en/api-documentation', false),
  ('zapier', 'Zapier', 'Easy automation for busy people - connect your apps', 'lightning', 'https://platform.zapier.com/docs', false),
  ('n8n', 'n8n', 'Open-source workflow automation tool with fair-code license', 'git-branch', 'https://docs.n8n.io/', false),
  ('power-automate', 'Power Automate', 'Microsoft cloud-based service for automating workflows', 'microsoft', 'https://learn.microsoft.com/en-us/power-automate/', false)
ON CONFLICT (id) DO NOTHING;

-- API key usage audit log (optional, for tracking)
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  integration_id VARCHAR(50) REFERENCES integrations(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage queries
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_time ON api_key_usage(created_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

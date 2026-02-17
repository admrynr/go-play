-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add tenant_id to pages
ALTER TABLE pages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Migrate existing data from pages to tenants
INSERT INTO tenants (user_id, username, business_name)
SELECT owner_id, slug, business_name
FROM pages
WHERE owner_id IS NOT NULL
ON CONFLICT (username) DO NOTHING;

-- Link pages to tenants
UPDATE pages
SET tenant_id = tenants.id
FROM tenants
WHERE pages.owner_id = tenants.user_id;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pages_tenant_id ON pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_username ON tenants(username);

-- RLS for tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants are viewable by their owners
CREATE POLICY "Tenants are viewable by their owners"
  ON tenants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Super admins can do everything (role 1)
CREATE POLICY "Super admins can manage all tenants"
  ON tenants FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')::int = 1);

-- Function to check if username is available
CREATE OR REPLACE FUNCTION check_username_available(username_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM tenants WHERE username = username_to_check);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

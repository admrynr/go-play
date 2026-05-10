-- 020_tenant_users.sql

-- 1. Create tenant_users table
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin_rental',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_username ON tenant_users(username);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 2. Update get_user_email_by_username RPC
CREATE OR REPLACE FUNCTION get_user_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Check owners first
  SELECT au.email INTO v_email
  FROM tenants t
  JOIN auth.users au ON t.user_id = au.id
  WHERE t.username = p_username;

  IF v_email IS NOT NULL THEN
    RETURN v_email;
  END IF;

  -- Check admin rental users
  SELECT au.email INTO v_email
  FROM tenant_users tu
  JOIN auth.users au ON tu.user_id = au.id
  WHERE tu.username = p_username;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RLS Policies Updates

-- pages
DROP POLICY IF EXISTS "Owners can view their own pages" ON pages;
CREATE POLICY "Owners and admins can view their pages"
  ON pages FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can update their own pages" ON pages;
CREATE POLICY "Owners and admins can update their pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- stations
DROP POLICY IF EXISTS "Owners can manage their stations" ON stations;
CREATE POLICY "Owners and admins can manage their stations"
  ON stations FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- menu_items
DROP POLICY IF EXISTS "Owners can manage menu" ON menu_items;
CREATE POLICY "Owners and admins can manage menu"
  ON menu_items FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- sessions
DROP POLICY IF EXISTS "Owners can manage sessions" ON sessions;
CREATE POLICY "Owners and admins can manage sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- orders
DROP POLICY IF EXISTS "Owners can manage orders" ON orders;
CREATE POLICY "Owners and admins can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- order_items
DROP POLICY IF EXISTS "Owners can view order items" ON order_items;
CREATE POLICY "Owners and admins can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))));

-- bookings
DROP POLICY IF EXISTS "Owners can update their bookings" ON bookings;
CREATE POLICY "Owners and admins can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- wa_blacklist
DROP POLICY IF EXISTS "Owners can manage their blacklist" ON wa_blacklist;
CREATE POLICY "Owners and admins can manage their blacklist"
  ON wa_blacklist FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())))
  WITH CHECK (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- station_requests
DROP POLICY IF EXISTS "Tenants manage their station requests" ON station_requests;
CREATE POLICY "Owners and admins manage their station requests"
  ON station_requests FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())));

-- players
DROP POLICY IF EXISTS "Tenants can manage their specific players" ON players;
CREATE POLICY "Owners and admins can manage their specific players"
  ON players FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()) OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- vouchers
DROP POLICY IF EXISTS "Tenants can manage their vouchers" ON vouchers;
CREATE POLICY "Owners and admins can manage their vouchers"
  ON vouchers FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid()) OR tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

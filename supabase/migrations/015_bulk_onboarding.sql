-- Migration: 015_bulk_onboarding.sql
-- Adds columns needed for bulk onboarding pipeline (preview, claim, dummy data)

-- Tenants: add onboarding fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT true;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reviews INTEGER;

-- Sessions: add is_dummy flag for purging after claim
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Orders: add is_dummy flag
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Order Items: add is_dummy flag  
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Station_requests: add is_dummy flag
ALTER TABLE station_requests ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Stations: add is_dummy flag
ALTER TABLE stations ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- Menu items: add is_dummy flag
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;

-- RLS: Allow anonymous users to view unclaimed tenants (for preview route)
CREATE POLICY "Public can view unclaimed tenants"
  ON tenants FOR SELECT
  TO anon
  USING (is_claimed = false);

-- Index on is_claimed for faster preview lookups
CREATE INDEX IF NOT EXISTS idx_tenants_is_claimed ON tenants(is_claimed) WHERE is_claimed = false;

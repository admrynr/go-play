-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  whatsapp TEXT NOT NULL,
  total_hours NUMERIC DEFAULT 0,
  current_points NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, whatsapp)
);

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  code TEXT UNIQUE NOT NULL,
  hours_value INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_tenant_wa ON players(tenant_id, whatsapp);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_tenant ON vouchers(tenant_id);

-- RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Policies for Players
CREATE POLICY "Tenants can manage their specific players"
  ON players FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = players.tenant_id 
      AND tenants.user_id = auth.uid()
    )
  );

-- Policies for Vouchers
CREATE POLICY "Tenants can manage their vouchers"
  ON vouchers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenants 
      WHERE tenants.id = vouchers.tenant_id 
      AND tenants.user_id = auth.uid()
    )
  );

-- Add voucher_code to sessions to track usage
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS voucher_code TEXT;

-- Add loyalty config to tenants if checking fails (safety ddl)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'loyalty_program_active') THEN
    ALTER TABLE tenants ADD COLUMN loyalty_program_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'loyalty_target_hours') THEN
    ALTER TABLE tenants ADD COLUMN loyalty_target_hours INTEGER DEFAULT 10;
  END IF;
END $$;

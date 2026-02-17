-- Add owner_id to pages table to link websites to Supabase users (rental owners)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups by owner
CREATE INDEX IF NOT EXISTS idx_pages_owner_id ON pages(owner_id);

-- 1. STATIONS TABLE (For managing TV/Console units)
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "TV 1", "VIP Room"
  type TEXT DEFAULT 'PS5', -- PS4, PS5, etc.
  status TEXT DEFAULT 'idle', -- idle, active, maintenance
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MENU ITEMS TABLE (Food & Beverages)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT DEFAULT 'food', -- food, drink, snack, packet
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SESSIONS TABLE (Active play time)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE, -- denormalized for easier RLS
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE, -- Null if open billing
  duration_minutes INTEGER, -- Set for prepaid
  type TEXT DEFAULT 'open', -- open (billing), timer (prepaid)
  status TEXT DEFAULT 'active', -- active, completed, cancelled
  total_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE (F&B Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE, -- denormalized
  status TEXT DEFAULT 'pending', -- pending, preparing, served, paid
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE (Details of orders)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL, -- Snapshot of price at order time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Pages: Update to allow owners to see their own pages
CREATE POLICY "Owners can view their own pages"
  ON pages FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their own pages"
  ON pages FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert pages"
  ON pages FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Stations
CREATE POLICY "Owners can manage their stations"
  ON stations FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid()));

CREATE POLICY "Public/Players can view stations"
  ON stations FOR SELECT
  USING (true);

-- Menu Items
CREATE POLICY "Owners can manage menu"
  ON menu_items FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid()));

CREATE POLICY "Public/Players can view menu"
  ON menu_items FOR SELECT
  USING (true);

-- Sessions
CREATE POLICY "Owners can manage sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid()));

CREATE POLICY "Players can view/update their active session"
  ON sessions FOR ALL
  USING (true); -- Simplified for QR implementation, ideally should be token based

-- Orders
CREATE POLICY "Owners can manage orders"
  ON orders FOR ALL
  TO authenticated
  USING (page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid()));

CREATE POLICY "Players can view their own orders"
  ON orders FOR SELECT
  USING (true); -- Simplified for QR implementation

CREATE POLICY "Players can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Order Items
CREATE POLICY "Owners can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE page_id IN (SELECT id FROM pages WHERE owner_id = auth.uid())));

CREATE POLICY "Players can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);


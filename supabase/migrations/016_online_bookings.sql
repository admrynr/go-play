-- 016: Online Booking System
-- Creates bookings table, wa_blacklist table, RLS policies, and enables realtime

-- ─── BOOKINGS TABLE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT UNIQUE NOT NULL,           -- e.g. BK-4F2A
  page_id      UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  station_id   UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  nickname     TEXT NOT NULL,
  wa_number    TEXT NOT NULL,                  -- 628xxx format
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | active | completed | no_show | cancelled
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_page_id    ON bookings(page_id);
CREATE INDEX IF NOT EXISTS idx_bookings_station_id ON bookings(station_id);
CREATE INDEX IF NOT EXISTS idx_bookings_wa_number  ON bookings(wa_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(status);

-- ─── BLACKLIST TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wa_blacklist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  wa_number  TEXT NOT NULL,
  reason     TEXT DEFAULT 'no_show',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, wa_number)
);

CREATE INDEX IF NOT EXISTS idx_blacklist_page_wa ON wa_blacklist(page_id, wa_number);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_blacklist ENABLE ROW LEVEL SECURITY;

-- Public: anyone can create a booking
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public: anyone can read bookings for a page (needed for availability check)
CREATE POLICY "Public can read bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated owners can update bookings for their own page
CREATE POLICY "Owners can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM pages WHERE owner_id = auth.uid()
    )
  );

-- Public can read blacklist (for frontend validation)
CREATE POLICY "Public can read blacklist"
  ON wa_blacklist FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated owners can manage blacklist for their page
CREATE POLICY "Owners can manage their blacklist"
  ON wa_blacklist FOR ALL
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM pages WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    page_id IN (
      SELECT id FROM pages WHERE owner_id = auth.uid()
    )
  );

-- Service role can do everything (for auto-cancel cron)
CREATE POLICY "Service role full access bookings"
  ON bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access blacklist"
  ON wa_blacklist FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── REALTIME ────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

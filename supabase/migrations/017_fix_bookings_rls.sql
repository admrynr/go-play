-- 017: Fix / ensure RLS policies for bookings & wa_blacklist
-- Safe to re-run: uses DROP IF EXISTS before recreating

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Public can create bookings"    ON bookings;
DROP POLICY IF EXISTS "Public can read bookings"      ON bookings;
DROP POLICY IF EXISTS "Owners can update their bookings" ON bookings;
DROP POLICY IF EXISTS "Service role full access bookings" ON bookings;

-- Anyone (anon / authenticated) can create a booking
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read bookings (needed for live availability check)
CREATE POLICY "Public can read bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only the page owner can update bookings (check-in / cancel)
CREATE POLICY "Owners can update their bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM pages WHERE owner_id = auth.uid()
    )
  );

-- Service role has full access (for auto-cancel cron)
CREATE POLICY "Service role full access bookings"
  ON bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── WA_BLACKLIST ─────────────────────────────────────────────────────────────

ALTER TABLE wa_blacklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read blacklist"        ON wa_blacklist;
DROP POLICY IF EXISTS "Owners can manage their blacklist" ON wa_blacklist;
DROP POLICY IF EXISTS "Service role full access blacklist" ON wa_blacklist;

-- Anyone can read blacklist (for frontend validation on booking form)
CREATE POLICY "Public can read blacklist"
  ON wa_blacklist FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only the page owner can manage their blacklist
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

-- Service role has full access
CREATE POLICY "Service role full access blacklist"
  ON wa_blacklist FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

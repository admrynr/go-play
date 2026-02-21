-- Migration: 011_add_station_requests_and_login_rpc.sql

-- 1. Create RPC for Username Login
-- This function allows securely checking the email associated with a username
-- without exposing the auth.users table via RLS.
CREATE OR REPLACE FUNCTION get_user_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM tenants t
  JOIN auth.users au ON t.user_id = au.id
  WHERE t.username = p_username;
  
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create station_requests table for Player UI
CREATE TABLE IF NOT EXISTS station_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'add_time', 'stop_session', 'call_operator'
  payload JSONB, -- Optional data, e.g., {"duration": 60}
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster dashboard querying
CREATE INDEX IF NOT EXISTS idx_station_requests_pending ON station_requests(page_id, status) WHERE status = 'pending';

-- RLS for station_requests
ALTER TABLE station_requests ENABLE ROW LEVEL SECURITY;

-- Tenants can see requests for their pages
CREATE POLICY "Tenants manage their station requests"
  ON station_requests FOR ALL
  TO authenticated
  USING (
    page_id IN (
      SELECT id FROM pages WHERE owner_id = auth.uid() OR tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid())
    )
  );

-- Allow public insertion (players scanning QR codes)
CREATE POLICY "Public can insert station requests"
  ON station_requests FOR INSERT
  TO public
  WITH CHECK (true);

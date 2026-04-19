-- Add booking_id to sessions so we can identify online vs onsite transactions
ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Index for join performance
CREATE INDEX IF NOT EXISTS idx_sessions_booking_id ON sessions(booking_id);

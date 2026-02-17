-- Add hourly_rate column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2) DEFAULT 0;

-- Update RLS if necessary (existing policies should cover updates to own page)

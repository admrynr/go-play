-- Add rental_rates column to pages table to store type-specific pricing
-- Example: {"PS5": 20000, "PS4": 15000}
ALTER TABLE pages ADD COLUMN IF NOT EXISTS rental_rates JSONB DEFAULT '{}'::jsonb;

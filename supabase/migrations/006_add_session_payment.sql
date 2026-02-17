-- Add payment details to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS payment_method TEXT; -- 'cash', 'qris', 'transfer'
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cash_received DECIMAL(10, 2);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS change_given DECIMAL(10, 2);

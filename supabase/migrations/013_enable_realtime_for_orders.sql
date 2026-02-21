-- Migration: 013_enable_realtime_for_orders.sql

-- Add orders table to the supabase_realtime publication to enable live updates on the client side
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

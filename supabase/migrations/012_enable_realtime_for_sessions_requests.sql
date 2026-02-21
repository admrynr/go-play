-- Migration: 012_enable_realtime_for_sessions_requests.sql

-- Add tables to the supabase_realtime publication to enable live updates on the client side

-- Add sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- Add station_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE station_requests;

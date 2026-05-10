-- Add IoT device ID column to stations table
-- This allows each station to be linked to a Tuya smart plug device
ALTER TABLE stations ADD COLUMN IF NOT EXISTS iot_device_id TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN stations.iot_device_id IS 'Tuya IoT device ID for smart plug control. Nullable — stations without a smart plug work normally.';

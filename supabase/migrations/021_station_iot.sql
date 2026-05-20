-- Rename old smart plug column to IR blaster columns
-- Each station can be linked to an IR blaster + paired remote for TV control

-- Drop old column if it exists
ALTER TABLE stations DROP COLUMN IF EXISTS iot_device_id;

-- IR Blaster: Tuya infrared device ID (physical device)
ALTER TABLE stations ADD COLUMN IF NOT EXISTS ir_infrared_id TEXT;

-- IR Remote: Tuya paired remote ID (virtual remote bound to a specific TV)
ALTER TABLE stations ADD COLUMN IF NOT EXISTS ir_remote_id TEXT;

COMMENT ON COLUMN stations.ir_infrared_id IS 'Tuya IR blaster device ID. One blaster can cover multiple stations/TVs.';
COMMENT ON COLUMN stations.ir_remote_id IS 'Tuya paired remote ID for the TV connected to this station.';

-- Add smart plug device ID to stations for power monitoring
ALTER TABLE stations ADD COLUMN IF NOT EXISTS smart_plug_id TEXT;
COMMENT ON COLUMN stations.smart_plug_id IS 'Tuya Smart Plug Device ID used for power monitoring (Fraud detection)';

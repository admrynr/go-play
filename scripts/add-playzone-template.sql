-- Script untuk menambahkan PlayZone template ke database
-- Jalankan script ini di Supabase SQL Editor atau local development

INSERT INTO templates (name, description, component_name, default_config, is_active)
VALUES (
  'PlayZone Gaming',
  'Modern gaming club template with vibrant purple/pink/blue gradients, neon effects, and futuristic gaming aesthetics',
  'PlayZoneTemplate',
  '{"themeColor": "#9333EA"}'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

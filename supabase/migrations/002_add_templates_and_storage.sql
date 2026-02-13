-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  component_name TEXT NOT NULL,
  default_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update pages table to support templates
ALTER TABLE pages ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_config JSONB DEFAULT '{}'::jsonb;

-- Create index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_pages_template_id ON pages(template_id);

-- Insert the first template (StoryBrand)
INSERT INTO templates (name, description, component_name, default_config)
VALUES (
  'StoryBrand PS Rental',
  'Modern dark gaming theme with StoryBrand marketing structure (Hero, Problem, Features, Plan, Recap)',
  'StoryBrandTemplate',
  '{"themeColor": "#003791"}'::jsonb
)
ON CONFLICT DO NOTHING;

-- RLS Policies for templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Public can view active templates
CREATE POLICY "Public templates are viewable by everyone"
  ON templates FOR SELECT
  USING (is_active = true);

-- Only authenticated users can manage templates
CREATE POLICY "Authenticated users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete templates"
  ON templates FOR DELETE
  TO authenticated
  USING (true);

-- Note: Supabase Storage bucket 'logos' should be created manually in dashboard
-- Storage Policy will be: 
-- INSERT: authenticated users only
-- SELECT: public (anyone can view logos)

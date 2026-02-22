-- Migration: 014_add_page_links_and_storage.sql

-- Add new columns for social links and operational hours
ALTER TABLE pages ADD COLUMN IF NOT EXISTS instagram_link TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS tiktok_link TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS operational_hours TEXT;

-- NOTE: Supabase Storage buckets cannot be purely managed via raw physical SQL in the open source version
-- through normal migrations without using the Storage API or Dashboard.
-- However, we can create the bucket via inserting into storage.buckets if using the full postgres schema.
-- Let's ensure the bucket exists (this works if the storage schema exists).

INSERT INTO storage.buckets (id, name, public)
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for public_assets
-- 1. Public can view/download
CREATE POLICY "Public Assets are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'public_assets');

-- 2. Authenticated users can upload (insert)
CREATE POLICY "Authenticated users can upload to public_assets" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public_assets');

-- 3. Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update public_assets" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'public_assets');

-- 4. Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete public_assets" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'public_assets');

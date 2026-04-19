-- Fix existing pages where logo_text masih nama panjang dari bulk onboarding
-- Sync logo_text ke business_name untuk semua page yang ada
UPDATE pages
SET logo_text = business_name
WHERE logo_text IS NOT NULL
  AND logo_text != business_name;


-- Add block_settings to dorms
ALTER TABLE public.dorms
  ADD COLUMN IF NOT EXISTS block_settings jsonb DEFAULT '{}';

-- Add new columns to rooms
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS is_furnished boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_balcony boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suite_has_kitchenette boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suite_bathroom_count int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bed_configuration jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suite_bedrooms jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS block_number int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS floor_level text DEFAULT NULL;

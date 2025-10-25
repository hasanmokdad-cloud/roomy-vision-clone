-- Add room_types_json and cover_image columns to dorms table
-- These are nullable to avoid breaking existing rows

ALTER TABLE public.dorms
ADD COLUMN IF NOT EXISTS room_types_json JSONB,
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.dorms.room_types_json IS 'Structured room data with capacity, price, amenities, and images. Example: [{"type":"Single","capacity":1,"price":350,"amenities":["wifi","ac"],"images":[]}]';
COMMENT ON COLUMN public.dorms.cover_image IS 'Main exterior/building cover image URL';
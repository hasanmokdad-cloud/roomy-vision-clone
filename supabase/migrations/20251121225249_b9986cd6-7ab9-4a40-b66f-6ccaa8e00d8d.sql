-- Add panorama_urls column to rooms table for 360° virtual tours
ALTER TABLE public.rooms
ADD COLUMN panorama_urls text[] DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN public.rooms.panorama_urls IS 'Array of URLs for 360-degree panoramic images for virtual tours';
-- Add gallery_images column to store multiple images for common areas, kitchen, facilities, etc.
ALTER TABLE dorms 
ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN dorms.gallery_images IS 'Array of image URLs for common areas, kitchen, facilities, etc. Separate from room-specific images.';
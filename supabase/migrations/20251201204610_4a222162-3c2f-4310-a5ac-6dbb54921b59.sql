-- Add video_url column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add capacity_occupied column to rooms table  
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity_occupied INTEGER DEFAULT 0;

-- Add check constraint to ensure capacity_occupied doesn't exceed capacity
ALTER TABLE rooms ADD CONSTRAINT check_capacity_occupied 
  CHECK (capacity_occupied >= 0 AND capacity_occupied <= capacity);

COMMENT ON COLUMN rooms.video_url IS 'URL to room video in storage (max 100MB)';
COMMENT ON COLUMN rooms.capacity_occupied IS 'Current number of occupied spots in room';
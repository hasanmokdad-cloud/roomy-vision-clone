-- Phase 1: Add current_dorm_id and current_room_id to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS current_dorm_id UUID REFERENCES dorms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- Phase 2: Add capacity_occupied to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS capacity_occupied INTEGER DEFAULT 0;

-- Phase 3: Initialize capacity_occupied for existing rooms
UPDATE rooms 
SET capacity_occupied = 0 
WHERE capacity_occupied IS NULL;

-- Phase 4: Create trigger to sync room capacity with bookings
-- Note: This assumes bookings table has a room_id column or will be added
-- If bookings table currently uses dorm_id only, this will need adjustment

CREATE OR REPLACE FUNCTION sync_room_capacity()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is confirmed, increment capacity
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE rooms 
    SET 
      capacity_occupied = capacity_occupied + 1,
      available = CASE WHEN capacity_occupied + 1 >= capacity THEN false ELSE true END
    WHERE id = NEW.dorm_id; -- Using dorm_id for now since bookings may not have room_id
    
  -- When a booking is cancelled or rejected, decrement capacity
  ELSIF OLD.status = 'approved' AND NEW.status IN ('cancelled', 'declined') THEN
    UPDATE rooms 
    SET 
      capacity_occupied = GREATEST(0, capacity_occupied - 1),
      available = true
    WHERE id = OLD.dorm_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_room_capacity_trigger ON bookings;

CREATE TRIGGER sync_room_capacity_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_room_capacity();

-- Add comments for documentation
COMMENT ON COLUMN students.current_dorm_id IS 'Current dorm where student lives (if accommodation_status = have_dorm)';
COMMENT ON COLUMN students.current_room_id IS 'Current room where student lives (if accommodation_status = have_dorm)';
COMMENT ON COLUMN rooms.capacity_occupied IS 'Number of beds currently occupied in this room';
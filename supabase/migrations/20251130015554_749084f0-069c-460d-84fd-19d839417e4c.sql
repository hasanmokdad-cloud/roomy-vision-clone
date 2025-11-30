-- Fix security issue: Add SET search_path to sync_room_capacity function
CREATE OR REPLACE FUNCTION sync_room_capacity()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
-- Function to increment room occupancy when a reservation is confirmed
CREATE OR REPLACE FUNCTION increment_room_occupancy(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE rooms 
  SET capacity_occupied = COALESCE(capacity_occupied, 0) + 1,
      available = CASE 
        WHEN COALESCE(capacity_occupied, 0) + 1 >= capacity THEN false 
        ELSE true 
      END
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement room occupancy when a student leaves
CREATE OR REPLACE FUNCTION decrement_room_occupancy(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE rooms 
  SET capacity_occupied = GREATEST(COALESCE(capacity_occupied, 0) - 1, 0),
      available = true
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
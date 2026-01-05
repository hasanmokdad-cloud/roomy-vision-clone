-- Update increment_room_occupancy function to increment both counters
-- and NOT automatically change availability
CREATE OR REPLACE FUNCTION increment_room_occupancy(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE rooms 
  SET capacity_occupied = COALESCE(capacity_occupied, 0) + 1,
      roomy_confirmed_occupants = COALESCE(roomy_confirmed_occupants, 0) + 1
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
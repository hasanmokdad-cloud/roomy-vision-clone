-- Fix search_path security warning for increment_room_occupancy function
CREATE OR REPLACE FUNCTION increment_room_occupancy(room_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.rooms 
  SET capacity_occupied = COALESCE(capacity_occupied, 0) + 1,
      roomy_confirmed_occupants = COALESCE(roomy_confirmed_occupants, 0) + 1
  WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
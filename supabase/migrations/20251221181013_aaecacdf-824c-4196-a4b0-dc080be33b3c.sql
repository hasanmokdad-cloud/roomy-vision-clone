-- Create function to increment roomy_confirmed_occupants
CREATE OR REPLACE FUNCTION public.increment_roomy_confirmed_occupants(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE rooms 
  SET roomy_confirmed_occupants = COALESCE(roomy_confirmed_occupants, 0) + 1
  WHERE id = p_room_id;
END;
$$;

-- Create function to decrement roomy_confirmed_occupants
CREATE OR REPLACE FUNCTION public.decrement_roomy_confirmed_occupants(p_room_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE rooms 
  SET roomy_confirmed_occupants = GREATEST(COALESCE(roomy_confirmed_occupants, 0) - 1, 0)
  WHERE id = p_room_id;
END;
$$;
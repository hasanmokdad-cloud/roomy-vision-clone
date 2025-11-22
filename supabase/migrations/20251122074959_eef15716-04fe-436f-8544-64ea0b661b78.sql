-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_booking_conflicts(
  p_owner_id UUID,
  p_dorm_id UUID,
  p_requested_date DATE,
  p_requested_time TIME
)
RETURNS TABLE(
  is_available BOOLEAN,
  conflict_type TEXT,
  conflict_details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_bookings INT;
  v_blocked_slots INT;
BEGIN
  -- Check for existing confirmed bookings at same time
  SELECT COUNT(*) INTO v_existing_bookings
  FROM public.tour_bookings
  WHERE owner_id = p_owner_id
    AND dorm_id = p_dorm_id
    AND DATE(scheduled_time) = p_requested_date
    AND EXTRACT(HOUR FROM scheduled_time) = EXTRACT(HOUR FROM p_requested_time::TIME)
    AND status IN ('confirmed', 'pending');
  
  -- Check for owner-blocked availability
  SELECT COUNT(*) INTO v_blocked_slots
  FROM public.owner_availability
  WHERE owner_id = p_owner_id
    AND (dorm_id = p_dorm_id OR dorm_id IS NULL)
    AND blocked_date = p_requested_date
    AND (
      all_day = true 
      OR (p_requested_time >= blocked_time_start AND p_requested_time < blocked_time_end)
    );
  
  -- Return results
  IF v_existing_bookings > 0 THEN
    RETURN QUERY SELECT 
      false, 
      'booking_conflict'::TEXT,
      jsonb_build_object('existing_bookings', v_existing_bookings);
  ELSIF v_blocked_slots > 0 THEN
    RETURN QUERY SELECT 
      false, 
      'owner_blocked'::TEXT,
      jsonb_build_object('reason', 'Owner unavailable');
  ELSE
    RETURN QUERY SELECT 
      true, 
      'available'::TEXT,
      '{}'::JSONB;
  END IF;
END;
$$;
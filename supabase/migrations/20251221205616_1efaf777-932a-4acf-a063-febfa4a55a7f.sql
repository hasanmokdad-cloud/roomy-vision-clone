CREATE OR REPLACE FUNCTION public.owner_can_view_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Check via bookings (existing logic)
    SELECT 1 FROM bookings b
    JOIN owners o ON b.owner_id = o.id
    WHERE b.student_id = p_student_id
    AND o.user_id = auth.uid()
  )
  OR EXISTS (
    -- Check via room_occupancy_claims
    SELECT 1 FROM room_occupancy_claims roc
    JOIN rooms r ON roc.room_id = r.id
    JOIN dorms d ON r.dorm_id = d.id
    JOIN owners o ON d.owner_id = o.id
    WHERE roc.student_id = p_student_id
    AND o.user_id = auth.uid()
  )
$$;
-- Add RLS policy to allow owners to view student info for their bookings
CREATE POLICY "Owners can view students for their bookings"
ON public.students
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT DISTINCT student_id 
    FROM bookings 
    WHERE owner_id IN (
      SELECT id FROM owners WHERE user_id = auth.uid()
    )
  )
);
-- Add SELECT policy for students to view their own contact tracking records
CREATE POLICY "Students can view their own contact tracking"
ON public.room_contact_tracking
FOR SELECT
USING (user_id = auth.uid());
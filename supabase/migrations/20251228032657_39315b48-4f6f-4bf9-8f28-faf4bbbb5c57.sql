-- Allow authenticated users to view other students' profiles (for AI Match feature)
CREATE POLICY "Authenticated users can view student profiles"
ON public.students
FOR SELECT
TO authenticated
USING (true);
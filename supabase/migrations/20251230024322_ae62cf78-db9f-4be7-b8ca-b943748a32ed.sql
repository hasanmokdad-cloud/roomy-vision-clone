-- Allow authenticated users to view owner profiles
-- This is needed so students can see owner names and details in conversations
CREATE POLICY "Authenticated users can view owner profiles"
ON public.owners
FOR SELECT
TO authenticated
USING (true);
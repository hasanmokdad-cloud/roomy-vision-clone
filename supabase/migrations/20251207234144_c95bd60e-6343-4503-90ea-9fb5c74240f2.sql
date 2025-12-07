-- Fix RLS policy for admins to update dorms
-- Drop the existing admin update policy if it exists
DROP POLICY IF EXISTS "Admins can update all dorms" ON public.dorms;

-- Create a new admin update policy using the is_admin function
CREATE POLICY "Admins can update all dorms"
ON public.dorms
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
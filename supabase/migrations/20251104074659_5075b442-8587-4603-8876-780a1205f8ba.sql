-- Drop the existing "Admins can manage all owners" policy that allows all operations
DROP POLICY IF EXISTS "Admins can manage all owners" ON public.owners;

-- Create separate policies for admins with specific operations (no INSERT)
CREATE POLICY "Admins can update all owners"
ON public.owners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all owners"
ON public.owners
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- The edge function uses service role which bypasses RLS
-- No INSERT policy needed - this prevents manual inserts via dashboard
-- Only the edge function with service role can insert

-- Keep existing policies for owners to view/update their own profiles
-- These are already in place:
-- "Owners can view their own profile" 
-- "Owners can update their own profile"
-- "Admins can view all owners"
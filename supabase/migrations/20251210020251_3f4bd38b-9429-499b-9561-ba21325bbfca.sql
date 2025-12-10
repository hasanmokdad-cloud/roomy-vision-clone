-- Drop the conflicting UPDATE policy that's missing WITH CHECK
DROP POLICY IF EXISTS "Owners can update rooms in own dorms" ON public.rooms;
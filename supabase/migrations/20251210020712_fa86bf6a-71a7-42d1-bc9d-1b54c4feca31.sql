-- Drop the misconfigured admin ALL policy that applies to all roles with NULL WITH CHECK
DROP POLICY IF EXISTS "Admins can manage all rooms" ON public.rooms;
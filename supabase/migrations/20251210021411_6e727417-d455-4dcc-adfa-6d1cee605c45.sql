-- Grant write permissions to authenticated role on rooms table
-- This fixes the "permission denied for table rooms" error in bulk operations
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;

-- Also ensure the anon role can read rooms (for public listings)
GRANT SELECT ON public.rooms TO anon;
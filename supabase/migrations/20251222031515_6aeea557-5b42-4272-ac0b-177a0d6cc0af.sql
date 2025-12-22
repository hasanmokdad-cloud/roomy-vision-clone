-- Grant INSERT, UPDATE, DELETE privileges to authenticated role on dorms table
-- This is required for RLS policies to work properly on the dorms table
GRANT INSERT, UPDATE, DELETE ON public.dorms TO authenticated;

-- Also ensure anon role has SELECT for public dorm browsing
GRANT SELECT ON public.dorms TO anon;

-- Ensure anon and authenticated roles have SELECT permissions on dorms and rooms tables
-- First revoke any conflicting permissions to start fresh
REVOKE ALL ON public.dorms FROM anon, authenticated;
REVOKE ALL ON public.rooms FROM anon, authenticated;

-- Grant SELECT permission to anon role (for non-logged-in users)
GRANT SELECT ON public.dorms TO anon;
GRANT SELECT ON public.rooms TO anon;

-- Grant SELECT permission to authenticated role (for logged-in users)
GRANT SELECT ON public.dorms TO authenticated;
GRANT SELECT ON public.rooms TO authenticated;

-- Grant USAGE on schema public (required for table access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Verify the grants were applied by checking a test query would work
-- This comment serves as documentation that these grants are critical for the listings page

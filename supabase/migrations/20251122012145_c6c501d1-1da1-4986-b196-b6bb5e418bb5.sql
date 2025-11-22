-- Drop the unused dorms_public view
DROP VIEW IF EXISTS public.dorms_public CASCADE;

-- Clear any existing permissions and start fresh
REVOKE ALL ON public.dorms FROM anon, authenticated;
REVOKE ALL ON public.rooms FROM anon, authenticated;

-- Grant SELECT permission explicitly to anon role (for non-logged-in users)
GRANT SELECT ON public.dorms TO anon;
GRANT SELECT ON public.rooms TO anon;

-- Grant SELECT permission explicitly to authenticated role (for logged-in users)
GRANT SELECT ON public.dorms TO authenticated;
GRANT SELECT ON public.rooms TO authenticated;

-- Ensure schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Verify permissions were applied correctly
DO $$
BEGIN
  IF NOT has_table_privilege('anon', 'public.dorms', 'SELECT') THEN
    RAISE EXCEPTION 'FAILED: anon role does not have SELECT on dorms';
  END IF;
  
  IF NOT has_table_privilege('authenticated', 'public.dorms', 'SELECT') THEN
    RAISE EXCEPTION 'FAILED: authenticated role does not have SELECT on dorms';
  END IF;
  
  IF NOT has_table_privilege('anon', 'public.rooms', 'SELECT') THEN
    RAISE EXCEPTION 'FAILED: anon role does not have SELECT on rooms';
  END IF;
  
  IF NOT has_table_privilege('authenticated', 'public.rooms', 'SELECT') THEN
    RAISE EXCEPTION 'FAILED: authenticated role does not have SELECT on rooms';
  END IF;
  
  RAISE NOTICE 'SUCCESS: All permissions verified correctly';
END $$;
-- Create a secure, isolated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions AUTHORIZATION postgres;

-- Move only safe-to-move extensions (skip Supabase-managed extensions like pg_net)
DO $$
DECLARE
  ext RECORD;
  safe_extensions TEXT[] := ARRAY['pgcrypto', 'uuid-ossp', 'pg_trgm', 'btree_gin', 'btree_gist'];
BEGIN
  FOR ext IN
    SELECT extname 
    FROM pg_extension 
    WHERE extnamespace = 'public'::regnamespace
      AND extname = ANY(safe_extensions)
  LOOP
    BEGIN
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions;', ext.extname);
      RAISE NOTICE 'Moved extension % to extensions schema', ext.extname;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not move extension %: %', ext.extname, SQLERRM;
    END;
  END LOOP;
END $$;
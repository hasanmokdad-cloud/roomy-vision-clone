
-- Use ALTER DEFAULT PRIVILEGES to ensure anon and authenticated can access tables
-- This is the Supabase-recommended way to grant permissions

-- For existing tables, grant permissions explicitly
ALTER TABLE public.dorms OWNER TO postgres;
ALTER TABLE public.rooms OWNER TO postgres;

-- Grant permissions using the Supabase-specific syntax
GRANT ALL ON public.dorms TO postgres;
GRANT SELECT ON public.dorms TO anon, authenticated;

GRANT ALL ON public.rooms TO postgres;
GRANT SELECT ON public.rooms TO anon, authenticated;

-- Ensure schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Set default privileges for future tables (best practice)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon, authenticated;

-- For the dorms_public view as well
GRANT SELECT ON public.dorms_public TO anon, authenticated;

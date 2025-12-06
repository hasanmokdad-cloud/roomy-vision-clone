-- Fix the view to use SECURITY INVOKER (default, but explicit is better)
-- This ensures RLS policies of the querying user are enforced
DROP VIEW IF EXISTS public.owner_messaging_info;

CREATE VIEW public.owner_messaging_info 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  full_name
FROM public.owners;

-- Re-grant access
GRANT SELECT ON public.owner_messaging_info TO authenticated;
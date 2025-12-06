-- Fix: Remove SECURITY DEFINER from view by recreating as regular view
-- The view only reads pg_catalog tables which don't need elevated privileges

DROP VIEW IF EXISTS public.security_rls_overview;

CREATE VIEW public.security_rls_overview AS
WITH policy_stats AS (
  SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    COUNT(*) FILTER (WHERE cmd = 'SELECT' OR cmd = '*') as select_count,
    COUNT(*) FILTER (WHERE cmd = 'INSERT' OR cmd = '*') as insert_count,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE' OR cmd = '*') as update_count,
    COUNT(*) FILTER (WHERE cmd = 'DELETE' OR cmd = '*') as delete_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
)
SELECT 
  t.tablename as table_name,
  t.rowsecurity as rls_enabled,
  COALESCE(p.policy_count, 0) as policy_count,
  COALESCE(p.select_count, 0) as select_policies,
  COALESCE(p.insert_count, 0) as insert_policies,
  COALESCE(p.update_count, 0) as update_policies,
  COALESCE(p.delete_count, 0) as delete_policies,
  CASE 
    WHEN t.tablename LIKE '%user%' 
      OR t.tablename LIKE '%device%' 
      OR t.tablename LIKE '%payment%' 
      OR t.tablename LIKE '%message%'
      OR t.tablename LIKE '%personality%' 
      OR t.tablename LIKE '%booking%'
      OR t.tablename LIKE '%log%' 
      OR t.tablename LIKE '%presence%'
      OR t.tablename LIKE '%session%' 
      OR t.tablename LIKE '%admin%'
      OR t.tablename LIKE '%reservation%'
      OR t.tablename LIKE '%payout%'
      OR t.tablename LIKE '%wallet%'
      OR t.tablename LIKE '%conversation%'
      OR t.tablename LIKE '%friendship%'
      OR t.tablename LIKE '%student%'
      OR t.tablename LIKE '%owner%'
    THEN true
    ELSE false
  END as is_sensitive,
  CASE
    WHEN t.rowsecurity = false AND t.tablename LIKE ANY(ARRAY['%user%', '%device%', '%payment%', '%message%', '%personality%', '%booking%', '%log%', '%presence%', '%session%', '%admin%', '%reservation%', '%payout%', '%wallet%', '%conversation%', '%friendship%', '%student%', '%owner%'])
    THEN 'CRITICAL: Sensitive table without RLS'
    WHEN t.rowsecurity = true AND COALESCE(p.policy_count, 0) = 0
    THEN 'WARNING: RLS enabled but no policies'
    WHEN t.rowsecurity = true AND COALESCE(p.select_count, 0) = 0
    THEN 'WARNING: No SELECT policy defined'
    ELSE 'OK'
  END as security_status
FROM pg_tables t
LEFT JOIN policy_stats p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
ORDER BY 
  CASE 
    WHEN t.rowsecurity = false THEN 0
    WHEN COALESCE(p.policy_count, 0) = 0 THEN 1
    ELSE 2
  END,
  t.tablename;

-- Grant read access to authenticated users for the view
GRANT SELECT ON public.security_rls_overview TO authenticated;
-- Security Regression Testing Functions
-- These functions enable automated security checks in CI/CD pipelines

-- Function to check RLS status and return tables with issues
CREATE OR REPLACE FUNCTION public.check_rls_regression()
RETURNS TABLE (
  tablename TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT,
  issue_type TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname)::BIGINT as policy_count,
    CASE 
      WHEN t.rowsecurity = false THEN 'critical'::TEXT
      WHEN COUNT(p.policyname) = 0 THEN 'warning'::TEXT
      ELSE 'ok'::TEXT
    END as issue_type,
    CASE 
      WHEN t.rowsecurity = false THEN 'RLS is disabled on table ' || t.tablename
      WHEN COUNT(p.policyname) = 0 THEN 'RLS enabled but no policies on table ' || t.tablename
      ELSE 'OK'
    END as message
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY 
    CASE WHEN t.rowsecurity = false THEN 0 ELSE 1 END,
    COUNT(p.policyname),
    t.tablename;
END;
$$;

-- Function to get table security status for CI/CD
CREATE OR REPLACE FUNCTION public.get_table_security_status()
RETURNS TABLE (
  tablename TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname)::BIGINT as policy_count
  FROM pg_tables t
  LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename, t.rowsecurity
  ORDER BY t.tablename;
$$;

-- Function to assert security baseline - returns true if all checks pass
CREATE OR REPLACE FUNCTION public.assert_security_baseline()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  tables_without_rls INTEGER;
  critical_tables TEXT[];
BEGIN
  -- Count tables without RLS
  SELECT COUNT(*)::INTEGER INTO tables_without_rls
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.rowsecurity = false;
  
  -- Get list of critical tables without RLS
  SELECT ARRAY_AGG(t.tablename) INTO critical_tables
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.rowsecurity = false;
  
  -- If any tables lack RLS, raise exception
  IF tables_without_rls > 0 THEN
    RAISE EXCEPTION 'Security baseline violation: % tables without RLS: %', 
      tables_without_rls, 
      array_to_string(critical_tables, ', ');
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions to authenticated users for CI/CD
GRANT EXECUTE ON FUNCTION public.check_rls_regression() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_security_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assert_security_baseline() TO authenticated;

-- Also grant to service role for automated testing
GRANT EXECUTE ON FUNCTION public.check_rls_regression() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_security_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_security_baseline() TO service_role;
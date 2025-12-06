-- Create private schema for internal security monitoring (not exposed via PostgREST/Data API)
CREATE SCHEMA IF NOT EXISTS private;

-- Grant usage to postgres and service_role only
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- View for detecting suspicious multi-region access (same user from multiple regions in <5 minutes)
CREATE OR REPLACE VIEW private.suspicious_multi_region_access AS
SELECT 
  user_id,
  ARRAY_AGG(DISTINCT ip_region ORDER BY ip_region) as regions,
  COUNT(DISTINCT ip_region) as region_count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 as minutes_span
FROM public.security_events
WHERE user_id IS NOT NULL
  AND ip_region IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 minutes'
GROUP BY user_id
HAVING COUNT(DISTINCT ip_region) > 1
  AND EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/60 < 5;

-- View for detecting excessive requests from same IP
CREATE OR REPLACE VIEW private.excessive_ip_requests AS
SELECT 
  COALESCE(details->>'ip_partial', 'unknown') as ip_partial,
  COUNT(*) as request_count,
  COUNT(DISTINCT event_type) as event_types,
  MIN(created_at) as first_request,
  MAX(created_at) as last_request
FROM public.security_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY details->>'ip_partial'
HAVING COUNT(*) > 50
ORDER BY request_count DESC;

-- View for failed security events (device denials, rate limits, invalid tokens)
CREATE OR REPLACE VIEW private.failed_security_events AS
SELECT 
  event_type,
  severity,
  ip_region,
  details->>'ip_partial' as ip_partial,
  user_id,
  created_at
FROM public.security_events
WHERE severity IN ('warning', 'critical')
  AND event_type IN ('device_denied', 'rate_limit_exceeded', 'invalid_token', 'all_sessions_revoked')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Index for efficient queries on security_events (using simple columns, not functions)
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events (created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events (event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events (severity);

-- Function to check all sensitive tables have proper RLS
CREATE OR REPLACE FUNCTION private.check_rls_regression()
RETURNS TABLE(
  table_name TEXT,
  issue_type TEXT,
  is_critical BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private', 'public'
AS $$
BEGIN
  -- Check for sensitive tables without RLS enabled
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    'Sensitive table without RLS enabled'::TEXT,
    TRUE
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.rowsecurity = FALSE
    AND t.tablename IN (
      'students', 'owners', 'admins', 'user_devices', 'trusted_devices',
      'payments', 'reservations', 'messages', 'conversations', 
      'security_events', 'system_logs', 'chat_context', 'friendships',
      'device_security_logs', 'billing_history', 'payout_history'
    );
  
  -- Check for RLS-enabled tables with zero policies
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    'RLS enabled but no policies defined'::TEXT,
    TRUE
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.rowsecurity = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.schemaname = 'public' AND p.tablename = t.tablename
    );
  
  -- Check for overly permissive policies with USING (true) on sensitive tables
  RETURN QUERY
  SELECT 
    p.tablename::TEXT,
    ('Overly permissive policy detected: ' || p.policyname)::TEXT,
    TRUE
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.qual = 'true'
    AND p.tablename IN (
      'students', 'owners', 'user_devices', 'trusted_devices',
      'payments', 'reservations', 'messages', 'conversations', 
      'security_events', 'system_logs', 'chat_context', 'friendships',
      'device_security_logs', 'billing_history', 'payout_history'
    );
END;
$$;

-- Function to assert security baseline - raises exception if critical issues found
CREATE OR REPLACE FUNCTION private.assert_security_baseline()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private', 'public'
AS $$
DECLARE
  critical_count INTEGER;
  issues TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(table_name || ': ' || issue_type, E'\n')
  INTO critical_count, issues
  FROM private.check_rls_regression()
  WHERE is_critical = TRUE;
  
  IF critical_count > 0 THEN
    RAISE EXCEPTION 'SECURITY BASELINE FAILED: % critical issues found:%', critical_count, E'\n' || issues;
  END IF;
  
  RETURN 'Security baseline check passed: 0 critical issues';
END;
$$;

-- Function to get hourly security summary (replaces materialized view)
CREATE OR REPLACE FUNCTION private.get_security_hourly_summary(hours_back INTEGER DEFAULT 168)
RETURNS TABLE(
  hour TIMESTAMPTZ,
  event_type TEXT,
  severity TEXT,
  event_count BIGINT,
  unique_users BIGINT,
  unique_regions BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('hour', se.created_at) as hour,
    se.event_type::TEXT,
    se.severity::TEXT,
    COUNT(*) as event_count,
    COUNT(DISTINCT se.user_id) as unique_users,
    COUNT(DISTINCT se.ip_region) as unique_regions
  FROM public.security_events se
  WHERE se.created_at > NOW() - (hours_back || ' hours')::INTERVAL
  GROUP BY DATE_TRUNC('hour', se.created_at), se.event_type, se.severity
  ORDER BY DATE_TRUNC('hour', se.created_at) DESC, COUNT(*) DESC;
END;
$$;

-- Rate limit tracking table for edge functions
CREATE TABLE IF NOT EXISTS private.edge_function_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  function_name TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_function 
ON private.edge_function_rate_limits (ip_hash, function_name, window_start);

-- Cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION private.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private'
AS $$
BEGIN
  DELETE FROM private.edge_function_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;
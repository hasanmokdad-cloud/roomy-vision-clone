-- ============================================
-- Security – New Tables Without RLS
-- Diagnostic Query for Supabase SQL Editor
-- ============================================
--
-- PURPOSE: Quickly identify tables with security issues
-- USAGE: Run in Supabase SQL Editor after schema changes
-- SAFETY: Read-only query, no data modifications
--
-- ============================================

-- Section 1: Critical Issues - Sensitive tables without RLS
SELECT 
  '🚨 CRITICAL' as severity,
  table_name,
  'Sensitive table without RLS enabled' as issue,
  'Enable RLS: ALTER TABLE public.' || table_name || ' ENABLE ROW LEVEL SECURITY;' as fix
FROM public.security_rls_overview
WHERE is_sensitive = true AND rls_enabled = false;

-- Section 2: Warning - RLS enabled but no policies
SELECT 
  '⚠️ WARNING' as severity,
  table_name,
  'RLS enabled but zero policies defined' as issue,
  'Add at least one policy for SELECT, INSERT, UPDATE, DELETE' as fix
FROM public.security_rls_overview
WHERE rls_enabled = true AND policy_count = 0;

-- Section 3: Warning - RLS enabled but no SELECT policy
SELECT 
  '⚠️ WARNING' as severity,
  table_name,
  'No SELECT policy - data may be inaccessible' as issue,
  'Add a SELECT policy to allow reading data' as fix
FROM public.security_rls_overview
WHERE rls_enabled = true AND select_policies = 0 AND policy_count > 0;

-- Section 4: Full Security Overview
SELECT 
  table_name,
  CASE WHEN rls_enabled THEN '✅' ELSE '❌' END as rls,
  policy_count as policies,
  select_policies as "SEL",
  insert_policies as "INS",
  update_policies as "UPD",
  delete_policies as "DEL",
  CASE WHEN is_sensitive THEN '🔒' ELSE '' END as sensitive,
  security_status as status
FROM public.security_rls_overview
ORDER BY 
  CASE security_status
    WHEN 'CRITICAL: Sensitive table without RLS' THEN 0
    WHEN 'WARNING: RLS enabled but no policies' THEN 1
    WHEN 'WARNING: No SELECT policy defined' THEN 2
    ELSE 3
  END,
  table_name;

-- Section 5: Recent DDL Audit Entries (last 7 days)
SELECT 
  event_time,
  action,
  object_name,
  CASE WHEN rls_enabled THEN '✅' ELSE '❌' END as rls_at_creation,
  policy_count as policies_at_creation,
  details->>'warning' as warning,
  CASE WHEN reviewed THEN '✅ Reviewed' ELSE '⏳ Pending' END as review_status
FROM public.security_schema_audit
WHERE event_time > now() - interval '7 days'
ORDER BY event_time DESC;

-- Section 6: Summary Statistics
SELECT 
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rls_enabled = true) as rls_enabled_count,
  COUNT(*) FILTER (WHERE rls_enabled = false) as rls_disabled_count,
  COUNT(*) FILTER (WHERE is_sensitive = true AND rls_enabled = false) as critical_issues,
  COUNT(*) FILTER (WHERE rls_enabled = true AND policy_count = 0) as no_policy_issues,
  COUNT(*) FILTER (WHERE security_status = 'OK') as healthy_tables
FROM public.security_rls_overview;

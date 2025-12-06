-- =====================================================
-- SECURITY HARDENING: Admin Audit Log & RLS Regression Testing
-- =====================================================

-- 1. Create admin_audit_log table (append-only audit trail)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'role_change', 'refund_approval', 'reservation_modify', 'dorm_delete', 'security_setting_change'
  affected_user_id UUID,
  affected_record_id TEXT,
  table_affected TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  ip_region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read access (no update/delete - append-only)
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Service role can insert (edge functions)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log FOR INSERT
WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX idx_admin_audit_action_type ON public.admin_audit_log(action_type, created_at DESC);
CREATE INDEX idx_admin_audit_admin_user ON public.admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_admin_audit_affected_user ON public.admin_audit_log(affected_user_id, created_at DESC);

-- 2. Create rls_regression_results table for storing test results
CREATE TABLE IF NOT EXISTS public.rls_regression_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT now(),
  passed BOOLEAN NOT NULL,
  issues_found INTEGER DEFAULT 0,
  issues_detail JSONB DEFAULT '[]',
  triggered_by TEXT DEFAULT 'scheduled' -- 'scheduled', 'schema_change', 'manual'
);

-- Enable RLS
ALTER TABLE public.rls_regression_results ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view RLS regression results"
ON public.rls_regression_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- System can insert
CREATE POLICY "System can insert RLS regression results"
ON public.rls_regression_results FOR INSERT
WITH CHECK (true);

-- 3. Create password_breach_logs table for tracking breach detection
CREATE TABLE IF NOT EXISTS public.password_breach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email_hash TEXT, -- SHA256 hash of email for privacy
  action_type TEXT NOT NULL, -- 'signup_blocked', 'reset_blocked'
  breach_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_breach_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view password breach logs"
ON public.password_breach_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- System can insert
CREATE POLICY "System can insert password breach logs"
ON public.password_breach_logs FOR INSERT
WITH CHECK (true);

-- 4. Create storage_rejection_logs table
CREATE TABLE IF NOT EXISTS public.storage_rejection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  bucket_name TEXT NOT NULL,
  file_name TEXT,
  rejection_reason TEXT NOT NULL, -- 'invalid_mime_type', 'file_too_large', 'blocked_extension'
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.storage_rejection_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view storage rejection logs"
ON public.storage_rejection_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- System can insert
CREATE POLICY "System can insert storage rejection logs"
ON public.storage_rejection_logs FOR INSERT
WITH CHECK (true);

-- 5. Create function to run scheduled RLS regression check and log results
CREATE OR REPLACE FUNCTION private.run_scheduled_rls_check()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  issues_record RECORD;
  issues_array JSONB := '[]';
  issues_count INTEGER := 0;
BEGIN
  FOR issues_record IN SELECT * FROM private.check_rls_regression()
  LOOP
    issues_count := issues_count + 1;
    issues_array := issues_array || jsonb_build_object(
      'table', issues_record.table_name,
      'issue', issues_record.issue_type,
      'critical', issues_record.is_critical
    );
    
    -- Log critical issues to security_events
    IF issues_record.is_critical THEN
      INSERT INTO public.security_events (event_type, severity, details)
      VALUES ('rls_regression_detected', 'critical', jsonb_build_object(
        'table', issues_record.table_name,
        'issue', issues_record.issue_type
      ));
    END IF;
  END LOOP;
  
  -- Insert test results
  INSERT INTO public.rls_regression_results (passed, issues_found, issues_detail, triggered_by)
  VALUES (issues_count = 0, issues_count, issues_array, 'scheduled');
END;
$$;

-- 6. Create trigger to run RLS check on schema changes
CREATE OR REPLACE FUNCTION private.on_schema_change()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run RLS check after schema changes
  PERFORM private.run_scheduled_rls_check();
END;
$$;

-- Create event trigger for DDL changes (tables only)
DROP EVENT TRIGGER IF EXISTS trigger_rls_check_on_ddl;
CREATE EVENT TRIGGER trigger_rls_check_on_ddl
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'ALTER TABLE', 'DROP POLICY', 'CREATE POLICY')
EXECUTE FUNCTION private.on_schema_change();

-- 7. Add new event types to track in security_events
COMMENT ON TABLE public.security_events IS 'Centralized security event logging. Event types: login_failed, device_verification_failed, device_verified, device_denied, all_sessions_revoked, rate_limit_exceeded, suspicious_activity, otp_failed, high_frequency_signup, password_breach_blocked, rls_regression_detected, storage_rejection';
-- ============================================
-- Security Guardrails: RLS Overview View & DDL Audit
-- ============================================

-- 1. Create security_rls_overview view for monitoring RLS status
CREATE OR REPLACE VIEW public.security_rls_overview AS
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

-- 2. Create security_schema_audit table for DDL event logging
CREATE TABLE IF NOT EXISTS public.security_schema_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL,
  object_type TEXT,
  object_name TEXT,
  schema_name TEXT DEFAULT 'public',
  rls_enabled BOOLEAN,
  policy_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ
);

-- Enable RLS on security_schema_audit (admin-only access)
ALTER TABLE public.security_schema_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view security audit logs"
ON public.security_schema_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert security audit logs"
ON public.security_schema_audit
FOR INSERT
WITH CHECK (true);

-- Admins can update (mark as reviewed)
CREATE POLICY "Admins can update security audit logs"
ON public.security_schema_audit
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- 3. Create DDL event trigger function (logs only, never blocks)
CREATE OR REPLACE FUNCTION public.log_security_ddl_event()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  obj RECORD;
  rls_status BOOLEAN;
  pol_count INTEGER;
BEGIN
  -- Only process CREATE TABLE events in public schema
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    -- Only log table creations
    IF obj.object_type = 'table' AND obj.schema_name = 'public' THEN
      -- Check RLS status
      SELECT rowsecurity INTO rls_status
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = obj.object_identity;
      
      -- Count policies
      SELECT COUNT(*) INTO pol_count
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = obj.object_identity;
      
      -- Insert audit log (never raise exception)
      INSERT INTO public.security_schema_audit (
        action,
        object_type,
        object_name,
        schema_name,
        rls_enabled,
        policy_count,
        details
      ) VALUES (
        'CREATE',
        obj.object_type,
        obj.object_identity,
        obj.schema_name,
        COALESCE(rls_status, false),
        COALESCE(pol_count, 0),
        jsonb_build_object(
          'command_tag', obj.command_tag,
          'in_extension', obj.in_extension,
          'warning', CASE 
            WHEN COALESCE(rls_status, false) = false 
            THEN 'New table created without RLS enabled'
            ELSE NULL
          END
        )
      );
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    -- Never block DDL, just log the error silently
    NULL;
END;
$$;

-- 4. Create the DDL event trigger
DROP EVENT TRIGGER IF EXISTS security_ddl_audit_trigger;
CREATE EVENT TRIGGER security_ddl_audit_trigger
ON ddl_command_end
EXECUTE FUNCTION public.log_security_ddl_event();

-- 5. Add index for faster audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_event_time 
ON public.security_schema_audit(event_time DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_reviewed 
ON public.security_schema_audit(reviewed) WHERE reviewed = false;
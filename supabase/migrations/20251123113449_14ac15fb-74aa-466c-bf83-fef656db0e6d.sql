-- Create RLS debugging infrastructure

-- Table to log all RLS permission errors
CREATE TABLE IF NOT EXISTS public.rls_errors_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  table_name text NOT NULL,
  operation text NOT NULL,
  error_message text,
  auth_uid uuid,
  expected_uid uuid,
  policy_evaluated text[],
  jwt_claims jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the errors log table
ALTER TABLE public.rls_errors_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all RLS errors
CREATE POLICY "Admins can view all RLS errors"
ON public.rls_errors_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- System can insert RLS error logs
CREATE POLICY "System can insert RLS errors"
ON public.rls_errors_log
FOR INSERT
WITH CHECK (true);

-- Function to debug current auth state
CREATE OR REPLACE FUNCTION public.debug_auth_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  user_roles_list text[];
BEGIN
  -- Get current auth.uid()
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'jwt_claims', auth.jwt(),
    'roles', COALESCE(
      (
        SELECT array_agg(r.name)
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
      ),
      ARRAY[]::text[]
    ),
    'owner_id', (
      SELECT id FROM owners WHERE user_id = auth.uid()
    ),
    'student_id', (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Enhanced user_owns_dorm function with logging
CREATE OR REPLACE FUNCTION public.user_owns_dorm(p_dorm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owns_dorm boolean;
  current_auth_uid uuid;
  owner_record_id uuid;
BEGIN
  current_auth_uid := auth.uid();
  
  -- Get owner record for current user
  SELECT id INTO owner_record_id
  FROM owners
  WHERE user_id = current_auth_uid;
  
  -- Check ownership
  SELECT EXISTS (
    SELECT 1
    FROM dorms d
    WHERE d.id = p_dorm_id
      AND d.owner_id = owner_record_id
  ) INTO owns_dorm;
  
  -- Log when ownership check fails
  IF NOT owns_dorm THEN
    INSERT INTO rls_errors_log (
      user_id, table_name, operation, error_message,
      auth_uid, expected_uid, jwt_claims
    ) VALUES (
      current_auth_uid,
      'dorms',
      'OWNERSHIP_CHECK',
      format('user_owns_dorm failed: auth.uid=%s, owner_id=%s, dorm_id=%s', 
             current_auth_uid, owner_record_id, p_dorm_id),
      current_auth_uid,
      owner_record_id,
      auth.jwt()
    );
  END IF;
  
  RETURN owns_dorm;
END;
$$;

-- Create index for faster log queries
CREATE INDEX IF NOT EXISTS idx_rls_errors_log_created_at ON public.rls_errors_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rls_errors_log_user_id ON public.rls_errors_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rls_errors_log_table_name ON public.rls_errors_log(table_name);
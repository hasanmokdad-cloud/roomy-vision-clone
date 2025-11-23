-- Fix user_owns_dorm function to be a pure function without logging
-- Using CREATE OR REPLACE to avoid cascade issues with dependent policies

CREATE OR REPLACE FUNCTION public.user_owns_dorm(p_dorm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Check ownership (no logging, just return boolean)
  SELECT EXISTS (
    SELECT 1
    FROM dorms d
    WHERE d.id = p_dorm_id
      AND d.owner_id = owner_record_id
  ) INTO owns_dorm;
  
  RETURN owns_dorm;
END;
$$;
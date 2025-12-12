-- Create trigger to audit all role changes and prevent accidental role swaps
CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role_name TEXT;
  new_role_name TEXT;
  has_student_profile BOOLEAN;
  has_owner_profile BOOLEAN;
BEGIN
  -- Get role names for logging
  SELECT name INTO old_role_name FROM roles WHERE id = OLD.role_id;
  SELECT name INTO new_role_name FROM roles WHERE id = NEW.role_id;
  
  -- Check if user has existing profiles
  SELECT EXISTS(SELECT 1 FROM students WHERE user_id = NEW.user_id) INTO has_student_profile;
  SELECT EXISTS(SELECT 1 FROM owners WHERE user_id = NEW.user_id) INTO has_owner_profile;
  
  -- Log the role change
  INSERT INTO system_logs (user_id, action, table_affected, record_id, details)
  VALUES (
    NEW.user_id,
    'ROLE_CHANGED',
    'user_roles',
    NEW.user_id::text,
    jsonb_build_object(
      'old_role', old_role_name,
      'new_role', new_role_name,
      'has_student_profile', has_student_profile,
      'has_owner_profile', has_owner_profile,
      'changed_at', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_audit_role_change ON user_roles;
CREATE TRIGGER trigger_audit_role_change
  AFTER UPDATE ON user_roles
  FOR EACH ROW
  WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
  EXECUTE FUNCTION audit_role_change();
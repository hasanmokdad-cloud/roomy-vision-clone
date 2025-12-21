-- Fix hasan.mokdad@aiesec.net account
-- 1. Assign student role (only if not exists)
INSERT INTO user_roles (user_id, role_id)
SELECT '8a352184-d2d8-4162-aad5-263f9d2f90d8', r.id
FROM roles r 
WHERE r.name = 'student'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = '8a352184-d2d8-4162-aad5-263f9d2f90d8'
);

-- 2. Create student profile (only if not exists)
INSERT INTO students (user_id, email, full_name)
SELECT '8a352184-d2d8-4162-aad5-263f9d2f90d8', 'hasan.mokdad@aiesec.net', 'hasan.mokdad'
WHERE NOT EXISTS (
  SELECT 1 FROM students s 
  WHERE s.user_id = '8a352184-d2d8-4162-aad5-263f9d2f90d8'
);

-- 3. Create assign_student_role function for use in signup flow
CREATE OR REPLACE FUNCTION public.assign_student_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
BEGIN
  -- Get student role id
  SELECT id INTO v_role_id FROM roles WHERE name = 'student';
  
  -- Only assign if role exists and user doesn't already have a role
  IF v_role_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = p_user_id
  ) THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (p_user_id, v_role_id);
  END IF;
END;
$$;
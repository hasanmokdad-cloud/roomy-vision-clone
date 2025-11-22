-- Create security definer function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = check_user_id 
    AND r.name = 'admin'
  );
END;
$$;

-- Drop the problematic recursive policy on user_roles
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;

-- Create new non-recursive policy using the security definer function
CREATE POLICY "Only admins can manage roles"
  ON user_roles
  FOR ALL
  USING (public.is_admin(auth.uid()));
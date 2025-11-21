-- PHASE 1: Clean up roles and ensure proper structure

-- Step 1: Remove duplicate user_roles entries (keep only the most recent one)
DELETE FROM user_roles a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_roles
  ORDER BY user_id, created_at DESC
);

-- Step 2: Remove unwanted roles from enum
-- First, drop the role column that uses the old enum
ALTER TABLE user_roles DROP COLUMN IF EXISTS role;

-- Drop the old enum
DROP TYPE IF EXISTS app_role CASCADE;

-- Create new enum with only the 3 roles we need
CREATE TYPE app_role AS ENUM ('admin', 'owner', 'student');

-- Step 3: Ensure roles table only has the 3 roles we want
DELETE FROM roles WHERE name NOT IN ('admin', 'owner', 'student');

-- Ensure we have all 3 roles
INSERT INTO roles (name) 
VALUES ('admin'), ('owner'), ('student')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Ensure students table has proper user_id column
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id unique for new entries
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_key ON students(user_id) WHERE user_id IS NOT NULL;

-- Step 5: Ensure owners table has proper user_id column  
ALTER TABLE owners
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id unique for new entries
CREATE UNIQUE INDEX IF NOT EXISTS owners_user_id_key ON owners(user_id) WHERE user_id IS NOT NULL;

-- Step 6: Ensure user_roles table structure is correct
ALTER TABLE user_roles 
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON user_roles(role_id);

-- Now create unique constraint on user_id (one role per user)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_unique ON user_roles(user_id);

-- Step 7: Populate role_id from role names for existing entries
UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role_id IS NULL
AND EXISTS (
  SELECT 1 FROM roles r2 
  WHERE r2.name = 'student' AND r.name = 'student'
);

-- Step 8: Create helper function to get role name by user_id
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
  LIMIT 1;
$$;

-- Step 9: Update RLS policies
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'admin'
  )
);
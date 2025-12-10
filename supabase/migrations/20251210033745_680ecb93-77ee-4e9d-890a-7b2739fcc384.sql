-- Step 1: Drop conflicting admin policies
DROP POLICY IF EXISTS "Admins can manage all dorms" ON dorms;
DROP POLICY IF EXISTS "Admins can update all dorms" ON dorms;
DROP POLICY IF EXISTS "Admins can update dorm verification status" ON dorms;

-- Step 2: Drop and recreate owner update policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Owners can update own dorms safe" ON dorms;

CREATE POLICY "Owners can update own dorms" 
ON dorms FOR UPDATE 
TO authenticated
USING (owner_id = get_current_owner_id())
WITH CHECK (owner_id = get_current_owner_id());

-- Step 3: Create single comprehensive admin policy
CREATE POLICY "Admins can manage all dorms" 
ON dorms FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
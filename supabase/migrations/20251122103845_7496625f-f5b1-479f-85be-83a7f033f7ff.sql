-- Step 1: Add user_id column to saved_rooms
ALTER TABLE saved_rooms ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Step 2: Populate user_id from student_id
UPDATE saved_rooms sr
SET user_id = s.user_id
FROM students s
WHERE sr.student_id = s.id;

-- Step 3: Drop the old RLS policy
DROP POLICY IF EXISTS "Users can manage their saved rooms" ON saved_rooms;

-- Step 4: Create new RLS policy using user_id
CREATE POLICY "Users can manage their saved rooms"
ON saved_rooms
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 5: Make user_id NOT NULL (after data migration)
ALTER TABLE saved_rooms ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Make student_id nullable for backwards compatibility
ALTER TABLE saved_rooms ALTER COLUMN student_id DROP NOT NULL;

-- Step 7: Add index for performance
CREATE INDEX idx_saved_rooms_user_id ON saved_rooms(user_id);
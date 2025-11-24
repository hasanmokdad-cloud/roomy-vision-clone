-- Add conversation management columns
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_pinned_archived 
ON conversations(is_pinned DESC, is_archived, updated_at DESC);

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "users_can_update_own_conversations" ON conversations;

CREATE POLICY "users_can_update_own_conversations"
ON conversations
FOR UPDATE
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
)
WITH CHECK (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
-- Phase 1: Fix RLS policy for admins to send support messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'admins_can_send_support_messages'
  ) THEN
    CREATE POLICY "admins_can_send_support_messages"
    ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
      sender_id = auth.uid() 
      AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
      )
      AND conversation_id IN (
        SELECT id FROM conversations WHERE conversation_type = 'support'
      )
    );
  END IF;
END $$;

-- Phase 2: Add message status columns for tracking delivery and read status
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_at timestamptz;

-- Add constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'messages_status_check'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_status_check 
    CHECK (status IN ('sent', 'delivered', 'seen'));
  END IF;
END $$;

-- Phase 3: Add index for improved conversation filtering
CREATE INDEX IF NOT EXISTS idx_conversations_type_updated 
ON conversations(conversation_type, updated_at DESC);

-- Phase 4: Update existing conversations to have proper conversation_type
UPDATE conversations 
SET conversation_type = 'dorm' 
WHERE conversation_type IS NULL 
AND dorm_id IS NOT NULL;

UPDATE conversations 
SET conversation_type = 'support' 
WHERE conversation_type IS NULL 
AND dorm_id IS NULL 
AND owner_id IS NULL;
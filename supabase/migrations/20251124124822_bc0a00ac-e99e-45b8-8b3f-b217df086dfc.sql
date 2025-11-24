-- Phase 1: Fix RLS - Allow admins to view support messages
CREATE POLICY "admins_can_view_support_messages"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() 
    AND r.name = 'admin'
  )
  AND conversation_id IN (
    SELECT id FROM conversations 
    WHERE conversation_type = 'support'
  )
);

-- Phase 3: Create user_thread_state table for unread tracking
CREATE TABLE IF NOT EXISTS user_thread_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Enable RLS on user_thread_state
ALTER TABLE user_thread_state ENABLE ROW LEVEL SECURITY;

-- RLS policy for user_thread_state
CREATE POLICY "users_manage_own_thread_state"
ON user_thread_state
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_thread_state_lookup 
ON user_thread_state(user_id, thread_id);

-- Phase 6: Add attachment columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_type text CHECK (attachment_type IN ('image', 'video', 'audio'));

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url text;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachment_duration integer;

-- Phase 6: Create message-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-media', 'message-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for message-media bucket
CREATE POLICY "authenticated_upload_message_media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-media');

CREATE POLICY "public_read_message_media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-media');

CREATE POLICY "users_delete_own_media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
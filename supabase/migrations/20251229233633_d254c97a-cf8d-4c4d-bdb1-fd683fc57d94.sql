-- Add group chat columns to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_description TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_photo_url TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 256;

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  added_by UUID,
  is_muted BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Members can view group members of groups they belong to
CREATE POLICY "Members can view group members" ON group_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    conversation_id IN (
      SELECT gm.conversation_id FROM group_members gm WHERE gm.user_id = auth.uid()
    )
  );

-- Users can join groups (insert themselves)
CREATE POLICY "Users can be added to groups" ON group_members
  FOR INSERT WITH CHECK (true);

-- Admins can update members (change role, mute, etc.)
CREATE POLICY "Admins can update members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.conversation_id = group_members.conversation_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

-- Admins can remove members
CREATE POLICY "Admins can remove members" ON group_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.conversation_id = group_members.conversation_id 
      AND gm.user_id = auth.uid() 
      AND gm.role = 'admin'
    )
  );

-- Create message_read_receipts table for group read status
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on message_read_receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

-- Users can view receipts for messages in their conversations
CREATE POLICY "Users can view read receipts" ON message_read_receipts
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Users can insert their own read receipts
CREATE POLICY "Users can insert own read receipts" ON message_read_receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own read receipts
CREATE POLICY "Users can update own read receipts" ON message_read_receipts
  FOR UPDATE USING (user_id = auth.uid());

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_group_members_conversation ON group_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user ON message_read_receipts(user_id);
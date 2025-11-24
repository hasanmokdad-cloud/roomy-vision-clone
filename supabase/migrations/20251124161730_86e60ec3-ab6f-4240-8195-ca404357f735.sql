-- ============================================
-- Phase 1: Universal Messaging System Migration
-- Transforms conversations into universal 1:1 DM system
-- ============================================

-- Add universal user identity columns to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS user_a_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS user_b_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add enhanced message metadata columns
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'voice')),
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
ADD COLUMN IF NOT EXISTS attachment_metadata JSONB;

-- Create index for efficient conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON conversations(user_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user_a_id, user_b_id);

-- Create index for message status queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "admins_can_view_support_messages" ON messages;
DROP POLICY IF EXISTS "admins_can_send_support_messages" ON messages;

-- Create new universal RLS policies for conversations
DROP POLICY IF EXISTS "universal_view_conversations" ON conversations;
CREATE POLICY "universal_view_conversations" ON conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_a_id OR 
    auth.uid() = user_b_id OR
    auth.uid() = student_id OR
    EXISTS (
      SELECT 1 FROM owners WHERE user_id = auth.uid() AND id = owner_id
    )
  );

DROP POLICY IF EXISTS "universal_create_conversations" ON conversations;
CREATE POLICY "universal_create_conversations" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_a_id OR 
    auth.uid() = user_b_id
  );

DROP POLICY IF EXISTS "universal_update_conversations" ON conversations;
CREATE POLICY "universal_update_conversations" ON conversations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_a_id OR 
    auth.uid() = user_b_id
  );

-- Create new universal RLS policies for messages
DROP POLICY IF EXISTS "universal_view_messages" ON messages;
CREATE POLICY "universal_view_messages" ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "universal_send_messages" ON messages;
CREATE POLICY "universal_send_messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "universal_update_messages" ON messages;
CREATE POLICY "universal_update_messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    receiver_id = auth.uid() OR sender_id = auth.uid()
  );

-- Function to automatically set receiver_id and status when inserting message
CREATE OR REPLACE FUNCTION set_message_receiver()
RETURNS TRIGGER AS $$
DECLARE
  conversation_user_a UUID;
  conversation_user_b UUID;
BEGIN
  -- Get the two participants from the conversation
  SELECT user_a_id, user_b_id INTO conversation_user_a, conversation_user_b
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Set receiver_id to the other participant
  IF NEW.sender_id = conversation_user_a THEN
    NEW.receiver_id := conversation_user_b;
  ELSE
    NEW.receiver_id := conversation_user_a;
  END IF;
  
  -- Set sent_at if not already set
  IF NEW.sent_at IS NULL THEN
    NEW.sent_at := NOW();
  END IF;
  
  -- Set default status
  IF NEW.status IS NULL THEN
    NEW.status := 'sent';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic receiver_id setting
DROP TRIGGER IF EXISTS set_message_receiver_trigger ON messages;
CREATE TRIGGER set_message_receiver_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_receiver();

-- Function to get or create a 1:1 conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_a_id UUID,
  p_user_b_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_smaller_id UUID;
  v_larger_id UUID;
BEGIN
  -- Ensure deterministic ordering (smaller UUID always in user_a_id)
  IF p_user_a_id < p_user_b_id THEN
    v_smaller_id := p_user_a_id;
    v_larger_id := p_user_b_id;
  ELSE
    v_smaller_id := p_user_b_id;
    v_larger_id := p_user_a_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE (user_a_id = v_smaller_id AND user_b_id = v_larger_id)
     OR (user_a_id = v_larger_id AND user_b_id = v_smaller_id)
  LIMIT 1;
  
  -- Create if doesn't exist
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user_a_id, user_b_id, conversation_type)
    VALUES (v_smaller_id, v_larger_id, 'direct')
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get first admin user (for support conversations)
CREATE OR REPLACE FUNCTION get_support_admin_id()
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get first admin user
  SELECT user_id INTO v_admin_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = 'admin'
  ORDER BY ur.created_at ASC
  LIMIT 1;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE conversations IS 'Universal 1:1 conversations supporting all role combinations (student↔student, student↔owner, student↔admin, owner↔admin)';
COMMENT ON COLUMN conversations.user_a_id IS 'First participant (smaller UUID by convention)';
COMMENT ON COLUMN conversations.user_b_id IS 'Second participant (larger UUID by convention)';
COMMENT ON COLUMN messages.type IS 'Message type: text, image, video, or voice';
COMMENT ON COLUMN messages.status IS 'Delivery status: sent, delivered, seen';
COMMENT ON COLUMN messages.sent_at IS 'When sender sent the message';
COMMENT ON COLUMN messages.delivered_at IS 'When receiver client received the message';
COMMENT ON COLUMN messages.read_at IS 'When receiver viewed the message';
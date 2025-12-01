-- Create message_reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Add missing columns to messages table
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_for_all BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id);

-- RLS policies for message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on messages they can see
CREATE POLICY "Users can view reactions on accessible messages" ON message_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messages 
      WHERE sender_id = auth.uid() 
      OR receiver_id = auth.uid()
      OR conversation_id IN (
        SELECT id FROM conversations 
        WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
        OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
      )
    )
  );

-- Users can add reactions
CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions" ON message_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
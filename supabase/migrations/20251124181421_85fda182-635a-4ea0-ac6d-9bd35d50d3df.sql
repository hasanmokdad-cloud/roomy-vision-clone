-- Phase 1: Simplify messages RLS policy
DROP POLICY IF EXISTS "universal_send_messages" ON messages;
CREATE POLICY "universal_send_messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Phase 2: Update set_message_receiver trigger function
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
  IF conversation_user_a IS NOT NULL AND conversation_user_b IS NOT NULL THEN
    IF NEW.sender_id = conversation_user_a THEN
      NEW.receiver_id := conversation_user_b;
    ELSE
      NEW.receiver_id := conversation_user_a;
    END IF;
  END IF;
  
  -- Set defaults for optional fields
  IF NEW.sent_at IS NULL THEN
    NEW.sent_at := NOW();
  END IF;
  
  IF NEW.status IS NULL THEN
    NEW.status := 'sent';
  END IF;
  
  IF NEW.type IS NULL THEN
    NEW.type := 'text';
  END IF;
  
  -- Ensure body has a default if null
  IF NEW.body IS NULL THEN
    NEW.body := '';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Phase 3: Update get_or_create_conversation function
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
  -- Ensure deterministic ordering
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
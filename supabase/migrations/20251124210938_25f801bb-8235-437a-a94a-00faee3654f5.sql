-- Fix conversations table constraint to include 'direct' type
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_conversation_type_check 
  CHECK (conversation_type IN ('dorm', 'support', 'direct'));
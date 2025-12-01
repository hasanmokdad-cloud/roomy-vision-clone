-- Create chat_context table for conversation memory
CREATE TABLE IF NOT EXISTS chat_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  context jsonb DEFAULT '{}',
  last_messages jsonb DEFAULT '[]',
  unresolved_questions jsonb DEFAULT '[]',
  last_match_session jsonb DEFAULT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE chat_context ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own context" 
  ON chat_context FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own context" 
  ON chat_context FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own context" 
  ON chat_context FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage all contexts" 
  ON chat_context FOR ALL 
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chat_context_user_id ON chat_context(user_id);
-- Create user_presence table for online status tracking
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  current_conversation_id UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can view online status (for showing green dot)
CREATE POLICY "Anyone can view presence" ON user_presence
  FOR SELECT USING (true);

-- Users can insert their own presence
CREATE POLICY "Users can insert own presence" ON user_presence
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own presence
CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (user_id = auth.uid());

-- Enable realtime for presence updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
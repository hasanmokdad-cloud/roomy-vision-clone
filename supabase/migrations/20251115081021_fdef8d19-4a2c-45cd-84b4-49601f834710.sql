-- Create ai_chat_sessions table for logging individual messages
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_session_id ON public.ai_chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_created_at ON public.ai_chat_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chat sessions
CREATE POLICY "Users can view their own chat sessions"
  ON public.ai_chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy: System can insert chat sessions
CREATE POLICY "System can insert chat sessions"
  ON public.ai_chat_sessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON public.ai_chat_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
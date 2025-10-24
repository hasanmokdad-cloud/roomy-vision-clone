-- Create chat_sessions table for conversation memory
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  history JSONB DEFAULT '[]'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sessions"
ON public.chat_sessions
FOR SELECT
USING (user_id = COALESCE(auth.uid()::text, session_id));

CREATE POLICY "Users can insert their own sessions"
ON public.chat_sessions
FOR INSERT
WITH CHECK (user_id = COALESCE(auth.uid()::text, session_id));

CREATE POLICY "Users can update their own sessions"
ON public.chat_sessions
FOR UPDATE
USING (user_id = COALESCE(auth.uid()::text, session_id));

-- Create indexes for performance
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX idx_chat_sessions_updated_at ON public.chat_sessions(updated_at DESC);

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
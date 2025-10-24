-- Create chat_logs table to store conversation history
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_logs
CREATE POLICY "Users can view their own chat history"
ON public.chat_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert chat logs"
ON public.chat_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_chat_logs_user_id ON public.chat_logs(user_id);
CREATE INDEX idx_chat_logs_created_at ON public.chat_logs(created_at DESC);
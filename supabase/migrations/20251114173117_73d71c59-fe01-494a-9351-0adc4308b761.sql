-- Create students_ai_responses table to store questionnaire answers
CREATE TABLE IF NOT EXISTS public.students_ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.students_ai_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view their own AI responses"
ON public.students_ai_responses
FOR SELECT
USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%');

-- Users can insert their own responses
CREATE POLICY "Users can insert their own AI responses"
ON public.students_ai_responses
FOR INSERT
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest_%');

-- Users can update their own responses
CREATE POLICY "Users can update their own AI responses"
ON public.students_ai_responses
FOR UPDATE
USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%');

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_students_ai_responses_user_id ON public.students_ai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_students_ai_responses_created_at ON public.students_ai_responses(created_at DESC);
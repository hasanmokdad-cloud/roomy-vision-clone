-- Phase 11: AI Feedback Learning Engine Tables

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_action TEXT NOT NULL CHECK (ai_action IN ('match_dorm', 'match_roommate', 'chat_answer')),
  target_id UUID, -- dorm_id, student_id, or null for chat
  helpful_score INTEGER NOT NULL CHECK (helpful_score >= 1 AND helpful_score <= 5),
  feedback_text TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_events table for logging
CREATE TABLE IF NOT EXISTS public.ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('match', 'chat', 'fallback', 'conversion')),
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON public.ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_target_id ON public.ai_feedback(target_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_ai_action ON public.ai_feedback(ai_action);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON public.ai_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_events_user_id ON public.ai_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_events_event_type ON public.ai_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_events_created_at ON public.ai_events(created_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.ai_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.ai_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.ai_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- RLS Policies for ai_events
CREATE POLICY "System can insert events"
  ON public.ai_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own events"
  ON public.ai_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
  ON public.ai_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );
-- Create calls table for call history and active call state
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL,
  receiver_id UUID,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended', 'missed', 'declined')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  ended_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create call_participants table for group calls
CREATE TABLE public.call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_video_off BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(call_id, user_id)
);

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for calls table
CREATE POLICY "Users can view calls they're part of"
  ON public.calls FOR SELECT
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create calls"
  ON public.calls FOR INSERT
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Call participants can update calls"
  ON public.calls FOR UPDATE
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- RLS policies for call_participants table
CREATE POLICY "Users can view call participants"
  ON public.call_participants FOR SELECT
  USING (
    call_id IN (
      SELECT id FROM public.calls 
      WHERE caller_id = auth.uid() OR receiver_id = auth.uid()
    )
  );

CREATE POLICY "Users can join calls"
  ON public.call_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation"
  ON public.call_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can leave calls"
  ON public.call_participants FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;

-- Create index for performance
CREATE INDEX idx_calls_conversation_id ON public.calls(conversation_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_call_participants_call_id ON public.call_participants(call_id);
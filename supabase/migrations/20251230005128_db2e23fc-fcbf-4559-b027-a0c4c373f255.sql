-- Create message_mentions table for @mentions tracking
CREATE TABLE public.message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_mentions
CREATE POLICY "Users can view mentions in their conversations"
  ON public.message_mentions FOR SELECT USING (
    mentioned_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_mentions.message_id AND m.sender_id = auth.uid()
    )
  );

CREATE POLICY "System can insert mentions"
  ON public.message_mentions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own mentions"
  ON public.message_mentions FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_mentions.message_id AND m.sender_id = auth.uid()
    )
  );

-- Create polls table
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  allow_multiple_answers BOOLEAN DEFAULT false,
  anonymous_votes BOOLEAN DEFAULT false,
  closes_at TIMESTAMPTZ,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)
);

-- Enable RLS for polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Users can view polls in their conversations"
  ON public.polls FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
    ) OR
    conversation_id IN (
      SELECT conversation_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create polls in their conversations"
  ON public.polls FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND (
      conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      ) OR
      conversation_id IN (
        SELECT conversation_id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Creators can update their polls"
  ON public.polls FOR UPDATE USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their polls"
  ON public.polls FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for poll_votes
CREATE POLICY "Users can view votes in their polls"
  ON public.poll_votes FOR SELECT USING (
    poll_id IN (
      SELECT id FROM public.polls WHERE conversation_id IN (
        SELECT id FROM public.conversations 
        WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
      ) OR conversation_id IN (
        SELECT conversation_id FROM public.group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can vote"
  ON public.poll_votes FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can change their vote"
  ON public.poll_votes FOR DELETE USING (user_id = auth.uid());

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
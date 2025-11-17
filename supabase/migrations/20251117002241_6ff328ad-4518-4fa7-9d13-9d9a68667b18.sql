-- Create user_preferences table for AI onboarding
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create tour_bookings table
CREATE TABLE IF NOT EXISTS public.tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  student_message TEXT,
  ai_suggested_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies for tour_bookings
CREATE POLICY "Students can view their own tour bookings"
  ON public.tour_bookings FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Owners can view bookings for their dorms"
  ON public.tour_bookings FOR SELECT
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

CREATE POLICY "Students can create tour bookings"
  ON public.tour_bookings FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can cancel their own bookings"
  ON public.tour_bookings FOR UPDATE
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) AND status = 'pending')
  WITH CHECK (status = 'cancelled');

CREATE POLICY "Owners can update bookings for their dorms"
  ON public.tour_bookings FOR UPDATE
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_tour_bookings_student_id ON public.tour_bookings(student_id);
CREATE INDEX idx_tour_bookings_owner_id ON public.tour_bookings(owner_id);
CREATE INDEX idx_tour_bookings_dorm_id ON public.tour_bookings(dorm_id);
CREATE INDEX idx_tour_bookings_scheduled_time ON public.tour_bookings(scheduled_time);
CREATE INDEX idx_tour_bookings_status ON public.tour_bookings(status);

-- Trigger to update updated_at
CREATE TRIGGER update_tour_bookings_updated_at
  BEFORE UPDATE ON public.tour_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
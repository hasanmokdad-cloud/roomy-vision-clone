-- Create owner_availability table for blocking dates/times
CREATE TABLE IF NOT EXISTS public.owner_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  blocked_time_start TIME,
  blocked_time_end TIME,
  reason TEXT,
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, dorm_id, blocked_date, blocked_time_start)
);

-- RLS policies for owner_availability
ALTER TABLE public.owner_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their availability"
  ON public.owner_availability FOR ALL
  USING (owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view availability"
  ON public.owner_availability FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_owner_availability_updated_at
  BEFORE UPDATE ON public.owner_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for owner_availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_availability;

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION public.check_booking_conflicts(
  p_owner_id UUID,
  p_dorm_id UUID,
  p_requested_date DATE,
  p_requested_time TIME
)
RETURNS TABLE(
  is_available BOOLEAN,
  conflict_type TEXT,
  conflict_details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_bookings INT;
  v_blocked_slots INT;
BEGIN
  -- Check for existing confirmed bookings at same time
  SELECT COUNT(*) INTO v_existing_bookings
  FROM public.tour_bookings
  WHERE owner_id = p_owner_id
    AND dorm_id = p_dorm_id
    AND DATE(scheduled_time) = p_requested_date
    AND EXTRACT(HOUR FROM scheduled_time) = EXTRACT(HOUR FROM p_requested_time::TIME)
    AND status IN ('confirmed', 'pending');
  
  -- Check for owner-blocked availability
  SELECT COUNT(*) INTO v_blocked_slots
  FROM public.owner_availability
  WHERE owner_id = p_owner_id
    AND (dorm_id = p_dorm_id OR dorm_id IS NULL)
    AND blocked_date = p_requested_date
    AND (
      all_day = true 
      OR (p_requested_time >= blocked_time_start AND p_requested_time < blocked_time_end)
    );
  
  -- Return results
  IF v_existing_bookings > 0 THEN
    RETURN QUERY SELECT 
      false, 
      'booking_conflict'::TEXT,
      jsonb_build_object('existing_bookings', v_existing_bookings);
  ELSIF v_blocked_slots > 0 THEN
    RETURN QUERY SELECT 
      false, 
      'owner_blocked'::TEXT,
      jsonb_build_object('reason', 'Owner unavailable');
  ELSE
    RETURN QUERY SELECT 
      true, 
      'available'::TEXT,
      '{}'::JSONB;
  END IF;
END;
$$;

-- Create public storage bucket for room images
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for room-images bucket
CREATE POLICY "Anyone can view room images"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

CREATE POLICY "Owners can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND auth.uid() IN (SELECT user_id FROM public.owners)
);

CREATE POLICY "Owners can delete their room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images'
  AND auth.uid() IN (SELECT user_id FROM public.owners)
);
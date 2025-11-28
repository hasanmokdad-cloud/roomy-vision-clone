-- Phase 3 & 5: Create booking_reminders and push_subscriptions tables

-- Booking Reminders Table
CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', '10min', 'start')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'owner')),
  recipient_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_booking_reminders_scheduled 
  ON booking_reminders(scheduled_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking 
  ON booking_reminders(booking_id);

-- Enable RLS
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_reminders
CREATE POLICY "Users can view their own reminders"
  ON booking_reminders FOR SELECT
  USING (recipient_user_id = auth.uid());

CREATE POLICY "System can manage reminders"
  ON booking_reminders FOR ALL
  USING (true);

-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Database function: find_next_available_slot (Phase 4)
CREATE OR REPLACE FUNCTION find_next_available_slot(
  p_owner_id UUID,
  p_dorm_id UUID,
  p_preferred_time TIME,
  p_start_from DATE
) RETURNS TABLE(available_date DATE, available_time TIME)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_check_date DATE;
  v_days_checked INTEGER := 0;
  v_max_days INTEGER := 30;
BEGIN
  v_check_date := p_start_from;
  
  WHILE v_days_checked < v_max_days LOOP
    -- Check if this date/time is available
    IF NOT EXISTS (
      -- Check owner_availability blocks
      SELECT 1 FROM owner_availability
      WHERE owner_id = p_owner_id
        AND (dorm_id = p_dorm_id OR dorm_id IS NULL)
        AND blocked_date = v_check_date
        AND (
          all_day = true 
          OR (p_preferred_time >= blocked_time_start::TIME AND p_preferred_time < blocked_time_end::TIME)
        )
    ) AND NOT EXISTS (
      -- Check existing bookings
      SELECT 1 FROM bookings
      WHERE owner_id = p_owner_id
        AND dorm_id = p_dorm_id
        AND requested_date = v_check_date
        AND requested_time = p_preferred_time::TEXT
        AND status IN ('pending', 'approved')
    ) THEN
      -- Found an available slot
      available_date := v_check_date;
      available_time := p_preferred_time;
      RETURN NEXT;
      RETURN;
    END IF;
    
    v_check_date := v_check_date + INTERVAL '1 day';
    v_days_checked := v_days_checked + 1;
  END LOOP;
  
  -- No available slot found
  RETURN;
END;
$$;
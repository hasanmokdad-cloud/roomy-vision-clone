-- Add notify_email column to owners table
ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true;

-- Create notifications_log table
CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.owners(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('verified', 'edited')),
  fields_changed JSONB,
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- RLS for notifications_log
CREATE POLICY "Admins can view all notifications"
  ON public.notifications_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can view their own notifications"
  ON public.notifications_log
  FOR SELECT
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Create index for performance
CREATE INDEX idx_notifications_log_owner_id ON public.notifications_log(owner_id);
CREATE INDEX idx_notifications_log_status ON public.notifications_log(status);
CREATE INDEX idx_notifications_log_sent_at ON public.notifications_log(sent_at);

-- Function to check rate limit (max 5 emails per hour per owner)
CREATE OR REPLACE FUNCTION public.check_notification_rate_limit(p_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO recent_count
  FROM public.notifications_log
  WHERE owner_id = p_owner_id
    AND sent_at > now() - INTERVAL '1 hour'
    AND status IN ('sent', 'pending');
  
  RETURN recent_count < 5;
END;
$$;

-- Function to check debounce (avoid duplicate notifications within 2 minutes)
CREATE OR REPLACE FUNCTION public.check_notification_debounce(
  p_owner_id UUID,
  p_event_type TEXT,
  p_dorm_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_notification TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT sent_at
  INTO recent_notification
  FROM public.notifications_log
  WHERE owner_id = p_owner_id
    AND event_type = p_event_type
    AND dorm_id = p_dorm_id
    AND sent_at > now() - INTERVAL '2 minutes'
  ORDER BY sent_at DESC
  LIMIT 1;
  
  RETURN recent_notification IS NULL;
END;
$$;

-- Function to log notification and trigger email
CREATE OR REPLACE FUNCTION public.queue_owner_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_record RECORD;
  fields_diff JSONB := '{}';
  should_notify BOOLEAN := false;
  event_type_val TEXT;
BEGIN
  -- Skip if no owner
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get owner details
  SELECT * INTO owner_record
  FROM public.owners
  WHERE id = NEW.owner_id;

  -- Skip if owner doesn't exist or has notifications disabled
  IF owner_record IS NULL OR owner_record.notify_email = false THEN
    RETURN NEW;
  END IF;

  -- Check for verification status change
  IF TG_OP = 'UPDATE' AND 
     OLD.verification_status != 'Verified' AND 
     NEW.verification_status = 'Verified' THEN
    should_notify := true;
    event_type_val := 'verified';
    fields_diff := jsonb_build_object(
      'verification_status', jsonb_build_array(OLD.verification_status, NEW.verification_status)
    );
  END IF;

  -- Check for significant field changes
  IF TG_OP = 'UPDATE' AND NEW.verification_status = 'Verified' THEN
    IF OLD.monthly_price IS DISTINCT FROM NEW.monthly_price THEN
      fields_diff := fields_diff || jsonb_build_object(
        'monthly_price', jsonb_build_array(OLD.monthly_price, NEW.monthly_price)
      );
      should_notify := true;
      event_type_val := 'edited';
    END IF;
    
    IF OLD.services_amenities IS DISTINCT FROM NEW.services_amenities THEN
      fields_diff := fields_diff || jsonb_build_object(
        'services_amenities', jsonb_build_array(OLD.services_amenities, NEW.services_amenities)
      );
      should_notify := true;
      event_type_val := 'edited';
    END IF;
    
    IF OLD.area IS DISTINCT FROM NEW.area THEN
      fields_diff := fields_diff || jsonb_build_object(
        'area', jsonb_build_array(OLD.area, NEW.area)
      );
      should_notify := true;
      event_type_val := 'edited';
    END IF;
    
    IF OLD.room_types IS DISTINCT FROM NEW.room_types THEN
      fields_diff := fields_diff || jsonb_build_object(
        'room_types', jsonb_build_array(OLD.room_types, NEW.room_types)
      );
      should_notify := true;
      event_type_val := 'edited';
    END IF;
    
    IF OLD.phone_number IS DISTINCT FROM NEW.phone_number THEN
      fields_diff := fields_diff || jsonb_build_object(
        'phone_number', jsonb_build_array(OLD.phone_number, NEW.phone_number)
      );
      should_notify := true;
      event_type_val := 'edited';
    END IF;
    
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      fields_diff := fields_diff || jsonb_build_object(
        'email', jsonb_build_array(OLD.email, NEW.email)
      );
      should_notify := true;
      event_type_val := 'edited';
    END IF;
  END IF;

  -- If should notify, check rate limit and debounce
  IF should_notify THEN
    IF NOT public.check_notification_rate_limit(NEW.owner_id) THEN
      -- Rate limit exceeded, log as skipped
      INSERT INTO public.notifications_log (
        dorm_id, owner_id, event_type, fields_changed, sent_to, status, error_message
      ) VALUES (
        NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email, 
        'skipped', 'Rate limit exceeded (5 per hour)'
      );
      RETURN NEW;
    END IF;

    IF NOT public.check_notification_debounce(NEW.owner_id, event_type_val, NEW.id) THEN
      -- Debounce active, skip
      INSERT INTO public.notifications_log (
        dorm_id, owner_id, event_type, fields_changed, sent_to, status, error_message
      ) VALUES (
        NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email,
        'skipped', 'Debounce active (2 minute window)'
      );
      RETURN NEW;
    END IF;

    -- Queue the notification
    INSERT INTO public.notifications_log (
      dorm_id, owner_id, event_type, fields_changed, sent_to, status
    ) VALUES (
      NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email, 'pending'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on dorms table
DROP TRIGGER IF EXISTS trigger_owner_notification ON public.dorms;
CREATE TRIGGER trigger_owner_notification
  AFTER UPDATE ON public.dorms
  FOR EACH ROW
  EXECUTE FUNCTION public.queue_owner_notification();

-- Enable realtime for notifications_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_log;
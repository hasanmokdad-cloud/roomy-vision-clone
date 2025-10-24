-- Add WhatsApp preferences to owners table
ALTER TABLE public.owners 
ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_language TEXT DEFAULT 'EN' CHECK (whatsapp_language IN ('EN', 'AR'));

-- Add channel column to notifications_log
ALTER TABLE public.notifications_log
ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'both'));

-- Create inquiries table for tracking student inquiries
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('chatbot', 'contact_form', 'direct')),
  message TEXT,
  student_name TEXT,
  student_email TEXT,
  student_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'responded', 'closed'))
);

-- Enable RLS on inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- RLS policies for inquiries
CREATE POLICY "Owners can view their own inquiries"
ON public.inquiries FOR SELECT
USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

CREATE POLICY "Students can view their own inquiries"
ON public.inquiries FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can insert inquiries"
ON public.inquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all inquiries"
ON public.inquiries FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inquiries_owner_id ON public.inquiries(owner_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_dorm_id ON public.inquiries(dorm_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- Update check_notification_rate_limit for WhatsApp (3 per hour)
CREATE OR REPLACE FUNCTION public.check_whatsapp_rate_limit(p_owner_id UUID)
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
    AND (channel = 'whatsapp' OR channel = 'both')
    AND status IN ('sent', 'pending');
  
  RETURN recent_count < 3;
END;
$$;

-- Update debounce to 10 minutes for WhatsApp
CREATE OR REPLACE FUNCTION public.check_whatsapp_debounce(p_owner_id UUID, p_event_type TEXT, p_dorm_id UUID)
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
    AND (channel = 'whatsapp' OR channel = 'both')
    AND sent_at > now() - INTERVAL '10 minutes'
  ORDER BY sent_at DESC
  LIMIT 1;
  
  RETURN recent_notification IS NULL;
END;
$$;

-- Trigger function for new inquiries
CREATE OR REPLACE FUNCTION public.notify_owner_new_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_record RECORD;
BEGIN
  -- Get owner details
  SELECT * INTO owner_record
  FROM public.owners
  WHERE id = NEW.owner_id;

  -- Skip if owner doesn't exist
  IF owner_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if both notifications are disabled
  IF owner_record.notify_email = false AND owner_record.notify_whatsapp = false THEN
    RETURN NEW;
  END IF;

  -- Check WhatsApp rate limit if enabled
  IF owner_record.notify_whatsapp = true THEN
    IF NOT public.check_whatsapp_rate_limit(NEW.owner_id) THEN
      INSERT INTO public.notifications_log (
        dorm_id, owner_id, event_type, sent_to, status, error_message, channel
      ) VALUES (
        NEW.dorm_id, NEW.owner_id, 'inquiry', owner_record.email,
        'skipped', 'WhatsApp rate limit exceeded (3 per hour)', 'whatsapp'
      );
      RETURN NEW;
    END IF;

    IF NOT public.check_whatsapp_debounce(NEW.owner_id, 'inquiry', NEW.dorm_id) THEN
      INSERT INTO public.notifications_log (
        dorm_id, owner_id, event_type, sent_to, status, error_message, channel
      ) VALUES (
        NEW.dorm_id, NEW.owner_id, 'inquiry', owner_record.email,
        'skipped', 'WhatsApp debounce active (10 minute window)', 'whatsapp'
      );
      RETURN NEW;
    END IF;
  END IF;

  -- Determine channel
  DECLARE
    notification_channel TEXT;
  BEGIN
    IF owner_record.notify_email = true AND owner_record.notify_whatsapp = true THEN
      notification_channel := 'both';
    ELSIF owner_record.notify_whatsapp = true THEN
      notification_channel := 'whatsapp';
    ELSE
      notification_channel := 'email';
    END IF;

    -- Queue the notification
    INSERT INTO public.notifications_log (
      dorm_id, owner_id, event_type, fields_changed, sent_to, status, channel
    ) VALUES (
      NEW.dorm_id, NEW.owner_id, 'inquiry', 
      jsonb_build_object('inquiry_id', NEW.id, 'message', NEW.message, 'student_name', NEW.student_name),
      owner_record.email, 'pending', notification_channel
    );
  END;

  RETURN NEW;
END;
$$;

-- Create trigger for new inquiries
DROP TRIGGER IF EXISTS trigger_new_inquiry_notification ON public.inquiries;
CREATE TRIGGER trigger_new_inquiry_notification
AFTER INSERT ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.notify_owner_new_inquiry();

-- Enable realtime for inquiries
ALTER PUBLICATION supabase_realtime ADD TABLE public.inquiries;
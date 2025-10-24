-- Update the queue_owner_notification function to determine channel properly
CREATE OR REPLACE FUNCTION public.queue_owner_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  owner_record RECORD;
  fields_diff JSONB := '{}';
  should_notify BOOLEAN := false;
  event_type_val TEXT;
  notification_channel TEXT;
BEGIN
  -- Skip if no owner
  IF NEW.owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get owner details
  SELECT * INTO owner_record
  FROM public.owners
  WHERE id = NEW.owner_id;

  -- Skip if owner doesn't exist or has both notifications disabled
  IF owner_record IS NULL OR (owner_record.notify_email = false AND owner_record.notify_whatsapp = false) THEN
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

  -- If should notify, determine channel and check rate limits
  IF should_notify THEN
    -- Determine notification channel
    IF owner_record.notify_email = true AND owner_record.notify_whatsapp = true AND owner_record.phone_number IS NOT NULL THEN
      notification_channel := 'both';
    ELSIF owner_record.notify_whatsapp = true AND owner_record.phone_number IS NOT NULL THEN
      notification_channel := 'whatsapp';
    ELSE
      notification_channel := 'email';
    END IF;

    -- Check WhatsApp rate limit if using WhatsApp
    IF notification_channel IN ('whatsapp', 'both') THEN
      IF NOT public.check_whatsapp_rate_limit(NEW.owner_id) THEN
        -- Rate limit exceeded, log as skipped
        INSERT INTO public.notifications_log (
          dorm_id, owner_id, event_type, fields_changed, sent_to, status, error_message, channel
        ) VALUES (
          NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email, 
          'skipped', 'WhatsApp rate limit exceeded (3 per hour)', notification_channel
        );
        RETURN NEW;
      END IF;

      IF NOT public.check_whatsapp_debounce(NEW.owner_id, event_type_val, NEW.id) THEN
        -- Debounce active, skip
        INSERT INTO public.notifications_log (
          dorm_id, owner_id, event_type, fields_changed, sent_to, status, error_message, channel
        ) VALUES (
          NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email,
          'skipped', 'WhatsApp debounce active (10 minute window)', notification_channel
        );
        RETURN NEW;
      END IF;
    END IF;

    -- Check email rate limit if using email only
    IF notification_channel = 'email' THEN
      IF NOT public.check_notification_rate_limit(NEW.owner_id) THEN
        INSERT INTO public.notifications_log (
          dorm_id, owner_id, event_type, fields_changed, sent_to, status, error_message, channel
        ) VALUES (
          NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email, 
          'skipped', 'Email rate limit exceeded (5 per hour)', 'email'
        );
        RETURN NEW;
      END IF;

      IF NOT public.check_notification_debounce(NEW.owner_id, event_type_val, NEW.id) THEN
        INSERT INTO public.notifications_log (
          dorm_id, owner_id, event_type, fields_changed, sent_to, status, error_message, channel
        ) VALUES (
          NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email,
          'skipped', 'Email debounce active (2 minute window)', 'email'
        );
        RETURN NEW;
      END IF;
    END IF;

    -- Queue the notification with appropriate channel
    INSERT INTO public.notifications_log (
      dorm_id, owner_id, event_type, fields_changed, sent_to, status, channel
    ) VALUES (
      NEW.id, NEW.owner_id, event_type_val, fields_diff, owner_record.email, 'pending', notification_channel
    );
  END IF;

  RETURN NEW;
END;
$$;
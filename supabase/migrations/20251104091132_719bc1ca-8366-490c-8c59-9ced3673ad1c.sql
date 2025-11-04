-- 1) Add SET search_path = public to all database functions

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has 'owner' role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.id AND role = 'owner'
  ) THEN
    INSERT INTO public.owners (user_id, full_name, email, phone_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone_number'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Determine role from email or metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  -- Create appropriate profile
  IF user_role = 'owner' THEN
    INSERT INTO public.owners (user_id, full_name, email, phone_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone_number'
    );
  ELSE
    INSERT INTO public.students (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_notification_rate_limit(p_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.check_notification_debounce(p_owner_id uuid, p_event_type text, p_dorm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.queue_owner_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_student_preference(p_student_id uuid, p_preference_type text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the appropriate preference array based on type
  IF p_preference_type = 'area' THEN
    UPDATE students
    SET favorite_areas = array_append(
      CASE WHEN p_value = ANY(favorite_areas) THEN favorite_areas
      ELSE favorite_areas END, 
      p_value
    ),
    ai_confidence_score = LEAST(ai_confidence_score + 2, 100),
    updated_at = now()
    WHERE id = p_student_id
    AND p_value != ALL(COALESCE(favorite_areas, '{}'));
    
  ELSIF p_preference_type = 'room_type' THEN
    UPDATE students
    SET preferred_room_types = array_append(
      CASE WHEN p_value = ANY(preferred_room_types) THEN preferred_room_types
      ELSE preferred_room_types END,
      p_value
    ),
    ai_confidence_score = LEAST(ai_confidence_score + 2, 100),
    updated_at = now()
    WHERE id = p_student_id
    AND p_value != ALL(COALESCE(preferred_room_types, '{}'));
    
  ELSIF p_preference_type = 'amenity' THEN
    UPDATE students
    SET preferred_amenities = array_append(
      CASE WHEN p_value = ANY(preferred_amenities) THEN preferred_amenities
      ELSE preferred_amenities END,
      p_value
    ),
    ai_confidence_score = LEAST(ai_confidence_score + 2, 100),
    updated_at = now()
    WHERE id = p_student_id
    AND p_value != ALL(COALESCE(preferred_amenities, '{}'));
  END IF;
  
  -- Log the preference change
  INSERT INTO preference_history (student_id, preference_type, value)
  VALUES (p_student_id, p_preference_type, p_value);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_student_ai_memory(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE students
  SET 
    favorite_areas = '{}',
    preferred_room_types = '{}',
    preferred_amenities = '{}',
    ai_confidence_score = 50,
    updated_at = now()
  WHERE id = p_student_id;
  
  -- Clear preference history
  DELETE FROM preference_history WHERE student_id = p_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_whatsapp_rate_limit(p_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.check_whatsapp_debounce(p_owner_id uuid, p_event_type text, p_dorm_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.notify_owner_new_inquiry()
RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.detect_owner_language()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default to Arabic if phone number starts with +961 (Lebanon)
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number LIKE '+961%' THEN
    NEW.whatsapp_language := 'AR';
  ELSE
    NEW.whatsapp_language := COALESCE(NEW.whatsapp_language, 'EN');
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Move PostgreSQL extensions to dedicated schema

CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions to extensions schema
ALTER EXTENSION pgcrypto SET SCHEMA extensions;
ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
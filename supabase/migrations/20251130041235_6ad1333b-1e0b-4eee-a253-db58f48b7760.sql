-- Phase T.0: Delete legacy dorms with NULL owner_id (keep only Test Dorm)
DELETE FROM dorms WHERE owner_id IS NULL;

-- Phase T.11: Fix database functions missing search_path for security
-- These functions need SECURITY DEFINER with explicit search_path to prevent search_path attacks

-- Fix update_conversation_timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- Fix generate_share_code
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  characters TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$function$;

-- Fix set_share_code
CREATE OR REPLACE FUNCTION public.set_share_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
    LOOP
      NEW.share_code := generate_share_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM shared_collections WHERE share_code = NEW.share_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix increment_collection_views
CREATE OR REPLACE FUNCTION public.increment_collection_views(p_share_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE shared_collections
  SET view_count = view_count + 1
  WHERE share_code = p_share_code AND is_public = true;
END;
$function$;

-- Fix update_personality_response_updated_at
CREATE OR REPLACE FUNCTION public.update_personality_response_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix set_message_receiver
CREATE OR REPLACE FUNCTION public.set_message_receiver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  conversation_user_a UUID;
  conversation_user_b UUID;
BEGIN
  -- Get the two participants from the conversation
  SELECT user_a_id, user_b_id INTO conversation_user_a, conversation_user_b
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Set receiver_id to the other participant
  IF conversation_user_a IS NOT NULL AND conversation_user_b IS NOT NULL THEN
    IF NEW.sender_id = conversation_user_a THEN
      NEW.receiver_id := conversation_user_b;
    ELSE
      NEW.receiver_id := conversation_user_a;
    END IF;
  END IF;
  
  -- Set defaults for optional fields
  IF NEW.sent_at IS NULL THEN
    NEW.sent_at := NOW();
  END IF;
  
  IF NEW.status IS NULL THEN
    NEW.status := 'sent';
  END IF;
  
  IF NEW.type IS NULL THEN
    NEW.type := 'text';
  END IF;
  
  -- Ensure body has a default if null
  IF NEW.body IS NULL THEN
    NEW.body := '';
  END IF;
  
  RETURN NEW;
END;
$function$;
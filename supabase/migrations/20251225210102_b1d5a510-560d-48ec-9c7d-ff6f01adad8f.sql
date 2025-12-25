-- Drop the pg_net based trigger as it requires app settings which aren't set
DROP TRIGGER IF EXISTS on_message_insert_notify ON public.messages;
DROP FUNCTION IF EXISTS public.trigger_message_notification();

-- Create a simpler trigger that just creates in-app notifications
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receiver_id UUID;
  v_conversation RECORD;
  v_sender_name TEXT;
BEGIN
  -- Only trigger on new text/media messages (skip system messages)
  IF NEW.type IS NOT NULL AND NEW.type NOT IN ('text', 'image', 'video', 'audio', 'document') THEN
    RETURN NEW;
  END IF;

  -- Skip empty messages
  IF NEW.body IS NULL OR NEW.body = '' THEN
    RETURN NEW;
  END IF;

  -- Get conversation to find receiver
  SELECT * INTO v_conversation FROM conversations WHERE id = NEW.conversation_id;
  
  IF v_conversation IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine receiver (the other participant in the conversation)
  IF v_conversation.user_a_id = NEW.sender_id THEN
    v_receiver_id := v_conversation.user_b_id;
  ELSE
    v_receiver_id := v_conversation.user_a_id;
  END IF;

  -- Skip if receiver couldn't be determined
  IF v_receiver_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name (try students, owners, admins)
  SELECT full_name INTO v_sender_name FROM students WHERE user_id = NEW.sender_id;
  IF v_sender_name IS NULL THEN
    SELECT full_name INTO v_sender_name FROM owners WHERE user_id = NEW.sender_id;
  END IF;
  IF v_sender_name IS NULL THEN
    SELECT full_name INTO v_sender_name FROM admins WHERE user_id = NEW.sender_id;
  END IF;
  IF v_sender_name IS NULL THEN
    v_sender_name := 'Someone';
  END IF;

  -- Create in-app notification for the receiver
  INSERT INTO notifications (user_id, title, message, metadata)
  VALUES (
    v_receiver_id,
    'Message from ' || v_sender_name,
    CASE 
      WHEN length(NEW.body) > 100 THEN substring(NEW.body, 1, 100) || '...'
      ELSE NEW.body
    END,
    jsonb_build_object(
      'type', 'message',
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'message_id', NEW.id
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block message insertion if notification fails
    RAISE WARNING 'Message notification creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on messages table for in-app notifications
CREATE TRIGGER on_message_insert_create_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();
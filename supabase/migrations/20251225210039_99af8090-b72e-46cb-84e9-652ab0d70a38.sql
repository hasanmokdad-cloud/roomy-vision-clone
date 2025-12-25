-- Enable pg_net extension for HTTP calls from triggers (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send message notification
CREATE OR REPLACE FUNCTION public.trigger_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_receiver_id UUID;
  v_conversation RECORD;
BEGIN
  -- Only trigger on new text messages (not system messages)
  IF NEW.type IS NOT NULL AND NEW.type NOT IN ('text', 'image', 'video', 'audio', 'document') THEN
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

  -- Call edge function via pg_net
  PERFORM net.http_post(
    url := CONCAT(
      current_setting('app.settings.supabase_url', true),
      '/functions/v1/send-message-notification'
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', current_setting('app.settings.service_role_key', true))
    ),
    body := jsonb_build_object(
      'message_id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'receiver_id', v_receiver_id,
      'body', COALESCE(NEW.body, '')
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block message insertion if notification fails
    RAISE WARNING 'Message notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_message_insert_notify ON public.messages;
CREATE TRIGGER on_message_insert_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_message_notification();
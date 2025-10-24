-- Fix security warning: Add search_path to detect_owner_language function
CREATE OR REPLACE FUNCTION public.detect_owner_language()
RETURNS TRIGGER
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
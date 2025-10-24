-- Add language tracking to notifications_log
ALTER TABLE public.notifications_log
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'EN' CHECK (language IN ('EN', 'AR'));

-- Update owner account detection to default AR for Lebanese numbers
CREATE OR REPLACE FUNCTION public.detect_owner_language()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Create trigger to auto-detect language on owner insert
DROP TRIGGER IF EXISTS trigger_detect_owner_language ON public.owners;
CREATE TRIGGER trigger_detect_owner_language
BEFORE INSERT ON public.owners
FOR EACH ROW
EXECUTE FUNCTION public.detect_owner_language();
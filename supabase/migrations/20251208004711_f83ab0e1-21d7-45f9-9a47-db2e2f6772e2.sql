-- Part 1: Update RLS Policy to check owner status
DROP POLICY IF EXISTS "Anyone can view verified available dorms" ON public.dorms;

CREATE POLICY "Anyone can view verified available dorms" 
ON public.dorms 
FOR SELECT
USING (
  verification_status = 'Verified' 
  AND available = true
  AND owner_id IN (SELECT id FROM owners WHERE status = 'active')
);

-- Part 2: Create trigger function to cascade owner status to dorms
CREATE OR REPLACE FUNCTION public.cascade_owner_status_to_dorms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When owner status changes to 'suspended', deactivate all their dorms
  IF NEW.status = 'suspended' AND (OLD.status IS NULL OR OLD.status != 'suspended') THEN
    UPDATE public.dorms 
    SET available = false, updated_at = now()
    WHERE owner_id = NEW.id;
  END IF;
  
  -- When owner status changes from 'suspended' to 'active', reactivate verified dorms
  IF NEW.status = 'active' AND OLD.status = 'suspended' THEN
    UPDATE public.dorms 
    SET available = true, updated_at = now()
    WHERE owner_id = NEW.id 
    AND verification_status = 'Verified';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Part 3: Create the trigger
DROP TRIGGER IF EXISTS on_owner_status_change ON public.owners;
CREATE TRIGGER on_owner_status_change
  AFTER UPDATE OF status ON public.owners
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_owner_status_to_dorms();

-- Part 4: Fix current data - set available = false for suspended owners' dorms
UPDATE public.dorms d
SET available = false, updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.owners o 
  WHERE o.id = d.owner_id 
  AND o.status = 'suspended'
);
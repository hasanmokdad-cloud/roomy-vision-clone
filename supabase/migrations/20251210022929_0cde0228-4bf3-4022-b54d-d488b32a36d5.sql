-- 1. Create a security definer function to check if owner is active
CREATE OR REPLACE FUNCTION public.is_active_owner(owner_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status = 'active' FROM owners WHERE id = owner_uuid),
    true  -- If no owner found (NULL owner_id), allow visibility
  );
$$;

-- 2. Drop the problematic policy that uses direct owners table access
DROP POLICY IF EXISTS "Anyone can view verified available dorms" ON public.dorms;

-- 3. Recreate policy using the security definer function
CREATE POLICY "Anyone can view verified available dorms"
ON public.dorms
FOR SELECT
TO public
USING (
  verification_status = 'Verified' 
  AND available = true 
  AND is_active_owner(owner_id)
);
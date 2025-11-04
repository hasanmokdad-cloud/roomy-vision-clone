-- 1. Drop the existing view first
DROP VIEW IF EXISTS public.dorms_public;

-- 2. Recreate dorms_public view with SECURITY INVOKER and correct column types
CREATE OR REPLACE VIEW public.dorms_public
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  dorm_name,
  location,
  area,
  university,
  verification_status,
  cover_image,
  image_url,
  price,
  monthly_price,
  room_types,
  room_types_json,
  capacity,
  amenities,
  gender_preference,
  shuttle,
  available,
  created_at,
  updated_at,
  type,
  description,
  address
FROM public.dorms
WHERE verification_status = 'Verified';

-- 3. Drop existing broad RLS policies on dorms
DROP POLICY IF EXISTS "Authenticated users can view verified dorms" ON public.dorms;
DROP POLICY IF EXISTS "Everyone can view verified dorms" ON public.dorms;

-- 4. Create new restrictive policy - only admins/owners can SELECT full dorms table
CREATE POLICY "Only admins and owners can view dorms"
ON public.dorms
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

-- 5. Grant SELECT on dorms_public to anonymous and authenticated users
GRANT SELECT ON public.dorms_public TO anon, authenticated;
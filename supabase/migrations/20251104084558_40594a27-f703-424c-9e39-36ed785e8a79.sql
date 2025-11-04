-- Create secure public view for dorms (hides sensitive contact info)
CREATE OR REPLACE VIEW public.dorms_public AS
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
  services_amenities AS amenities,
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

-- Grant access to the view
GRANT SELECT ON public.dorms_public TO anon, authenticated;

-- Update RLS: Remove anonymous access to full dorms table
DROP POLICY IF EXISTS "Everyone can view verified dorms" ON public.dorms;

-- Recreate policy to only allow authenticated admins/owners to see full details
CREATE POLICY "Authenticated users can view verified dorms"
ON public.dorms
FOR SELECT
TO authenticated
USING (verification_status = 'Verified' OR has_role(auth.uid(), 'admin'::app_role) OR owner_id IN (
  SELECT id FROM public.owners WHERE user_id = auth.uid()
));
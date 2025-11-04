-- Drop and recreate view without security definer
DROP VIEW IF EXISTS public.dorms_public;

CREATE VIEW public.dorms_public 
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

GRANT SELECT ON public.dorms_public TO anon, authenticated;
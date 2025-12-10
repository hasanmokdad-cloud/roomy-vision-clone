-- Fix the security definer view warning by recreating with SECURITY INVOKER
-- Views default to SECURITY INVOKER in Postgres, but we explicitly set it

DROP VIEW IF EXISTS public.dorms_public;

CREATE VIEW public.dorms_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  name,
  dorm_name,
  description,
  area,
  university,
  location,
  address,
  monthly_price,
  price,
  capacity,
  image_url,
  cover_image,
  gallery_images,
  verification_status,
  available,
  amenities,
  gender_preference,
  room_types,
  room_types_json,
  services_amenities,
  shuttle,
  type,
  website,
  created_at,
  updated_at
FROM public.dorms
WHERE verification_status = 'Verified' AND available = true;

-- Re-grant SELECT permissions
GRANT SELECT ON public.dorms_public TO anon;
GRANT SELECT ON public.dorms_public TO authenticated;

COMMENT ON VIEW public.dorms_public IS 'Public-safe view of verified dorms without owner contact info (email, phone, owner_id hidden). Uses SECURITY INVOKER for proper RLS enforcement.';
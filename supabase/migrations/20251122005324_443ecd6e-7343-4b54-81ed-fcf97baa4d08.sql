-- Grant SELECT permissions on dorms_public view to allow public access
GRANT SELECT ON dorms_public TO anon;
GRANT SELECT ON dorms_public TO authenticated;

-- Recreate the dorms_public view with security_invoker to properly inherit RLS
DROP VIEW IF EXISTS dorms_public;

CREATE VIEW dorms_public 
WITH (security_invoker = true)
AS
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
FROM dorms
WHERE verification_status = 'Verified' AND available = true;
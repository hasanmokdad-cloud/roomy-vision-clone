-- =====================================================
-- SECURITY HARDENING MIGRATION: RLS + Starting Price Fix
-- =====================================================

-- 1️⃣ FIX: PUBLIC OWNER DATA EXPOSURE
-- Drop policy that exposes owner data to students
DROP POLICY IF EXISTS "Students view verified dorm owners" ON public.owners;

-- 2️⃣ FIX: PUBLIC DORMS TABLE - Create safe public view
-- This view excludes sensitive contact fields (owner_id, email, phone)
DROP VIEW IF EXISTS public.dorms_public;

CREATE VIEW public.dorms_public AS
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

-- Grant SELECT on public view to anon and authenticated
GRANT SELECT ON public.dorms_public TO anon;
GRANT SELECT ON public.dorms_public TO authenticated;

-- Add comment explaining the view
COMMENT ON VIEW public.dorms_public IS 'Public-safe view of verified dorms without owner contact info (email, phone, owner_id hidden)';

-- 3️⃣ FIX: Starting Price Auto-Update Trigger
-- This ensures dorms.monthly_price always reflects MIN(rooms.price)

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.update_dorm_starting_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_dorm_id UUID;
  min_price NUMERIC;
BEGIN
  -- Determine which dorm to update
  target_dorm_id := COALESCE(NEW.dorm_id, OLD.dorm_id);
  
  -- Calculate minimum room price for this dorm
  SELECT MIN(price) INTO min_price
  FROM rooms
  WHERE dorm_id = target_dorm_id AND price IS NOT NULL;
  
  -- Update the dorm's starting price (both monthly_price and price columns)
  UPDATE dorms 
  SET 
    monthly_price = min_price,
    price = min_price,
    updated_at = now()
  WHERE id = target_dorm_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_dorm_starting_price ON public.rooms;

-- Create trigger on rooms table for INSERT, UPDATE of price, or DELETE
CREATE TRIGGER trigger_update_dorm_starting_price
AFTER INSERT OR UPDATE OF price OR DELETE
ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_dorm_starting_price();

-- 4️⃣ FIX: One-time update to fix all stale dorm prices
UPDATE dorms d
SET 
  monthly_price = subq.min_price,
  price = subq.min_price,
  updated_at = now()
FROM (
  SELECT dorm_id, MIN(price) as min_price
  FROM rooms
  WHERE price IS NOT NULL
  GROUP BY dorm_id
) subq
WHERE d.id = subq.dorm_id
AND (d.monthly_price IS DISTINCT FROM subq.min_price OR d.price IS DISTINCT FROM subq.min_price);

-- 5️⃣ Create helper function for safe owner display info (for messaging only)
CREATE OR REPLACE FUNCTION public.get_owner_display_info(owner_uuid UUID)
RETURNS TABLE(id UUID, full_name TEXT, profile_photo_url TEXT) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT id, full_name, profile_photo_url 
  FROM owners 
  WHERE id = owner_uuid;
$$;

-- Grant execute to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_owner_display_info(UUID) TO authenticated;
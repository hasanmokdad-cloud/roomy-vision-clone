-- Create admin RPC function for updating dorms (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_update_dorm(
  p_dorm_id uuid,
  p_name text DEFAULT NULL,
  p_dorm_name text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_area text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_capacity integer DEFAULT NULL,
  p_amenities text[] DEFAULT NULL,
  p_shuttle boolean DEFAULT NULL,
  p_gender_preference text DEFAULT NULL,
  p_available boolean DEFAULT NULL,
  p_verification_status text DEFAULT NULL,
  p_gallery_images text[] DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_cover_image text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_updated_count integer;
BEGIN
  -- Verify admin role
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF NOT public.is_admin(v_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions - admin role required';
  END IF;

  -- Update dorm with provided values (COALESCE preserves existing values if NULL passed)
  UPDATE public.dorms SET
    name = COALESCE(p_name, name),
    dorm_name = COALESCE(p_dorm_name, dorm_name),
    address = COALESCE(p_address, address),
    area = COALESCE(p_area, area),
    description = COALESCE(p_description, description),
    capacity = COALESCE(p_capacity, capacity),
    amenities = COALESCE(p_amenities, amenities),
    shuttle = COALESCE(p_shuttle, shuttle),
    gender_preference = COALESCE(p_gender_preference, gender_preference),
    available = COALESCE(p_available, available),
    verification_status = COALESCE(p_verification_status, verification_status),
    gallery_images = COALESCE(p_gallery_images, gallery_images),
    image_url = COALESCE(p_image_url, image_url),
    cover_image = COALESCE(p_cover_image, cover_image),
    updated_at = now()
  WHERE id = p_dorm_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'Dorm not found';
  END IF;

  -- Log admin action
  INSERT INTO public.system_logs (user_id, action, table_affected, record_id, details)
  VALUES (
    v_user_id, 
    'ADMIN_UPDATE_DORM', 
    'dorms', 
    p_dorm_id::text,
    jsonb_build_object('dorm_id', p_dorm_id, 'timestamp', now())
  );

  RETURN jsonb_build_object('success', true, 'dorm_id', p_dorm_id);
END;
$$;
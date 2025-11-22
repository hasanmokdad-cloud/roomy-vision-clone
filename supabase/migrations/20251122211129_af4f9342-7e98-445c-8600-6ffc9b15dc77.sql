-- Create a secure function to insert dorms that bypasses RLS
CREATE OR REPLACE FUNCTION public.insert_owner_dorm(
  p_owner_id uuid,
  p_name text,
  p_dorm_name text,
  p_address text,
  p_area text,
  p_university text,
  p_description text,
  p_image_url text,
  p_cover_image text,
  p_monthly_price numeric,
  p_capacity integer,
  p_amenities text[],
  p_shuttle boolean,
  p_gender_preference text,
  p_phone_number text,
  p_email text,
  p_website text,
  p_gallery_images text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_new_dorm_id uuid;
BEGIN
  -- Verify the caller owns this owner record
  SELECT user_id INTO v_user_id
  FROM owners
  WHERE id = p_owner_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner record not found for id: %', p_owner_id;
  END IF;
  
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only create dorms for your own owner account';
  END IF;
  
  -- Insert the dorm
  INSERT INTO dorms (
    owner_id,
    name,
    dorm_name,
    address,
    area,
    university,
    description,
    image_url,
    cover_image,
    location,
    monthly_price,
    price,
    capacity,
    amenities,
    shuttle,
    gender_preference,
    phone_number,
    email,
    website,
    gallery_images,
    verification_status,
    available
  )
  VALUES (
    p_owner_id,
    p_name,
    COALESCE(p_dorm_name, p_name),
    p_address,
    p_area,
    p_university,
    p_description,
    p_image_url,
    p_cover_image,
    COALESCE(p_area, p_address),
    p_monthly_price,
    p_monthly_price,
    p_capacity,
    p_amenities,
    p_shuttle,
    p_gender_preference,
    p_phone_number,
    p_email,
    p_website,
    p_gallery_images,
    'Pending',
    true
  )
  RETURNING id INTO v_new_dorm_id;
  
  RETURN v_new_dorm_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_owner_dorm TO authenticated;
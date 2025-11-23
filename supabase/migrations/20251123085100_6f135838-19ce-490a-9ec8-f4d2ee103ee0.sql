-- Create secure admin function to update dorm verification status
CREATE OR REPLACE FUNCTION public.admin_update_verification_status(
  p_dorm_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is admin
  SELECT public.is_admin(v_user_id) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Insufficient permissions - admin role required';
  END IF;
  
  -- Validate status
  IF p_new_status NOT IN ('Verified', 'Pending', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be Verified, Pending, or Rejected';
  END IF;
  
  -- Update the dorm
  UPDATE dorms
  SET verification_status = p_new_status,
      updated_at = now()
  WHERE id = p_dorm_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dorm not found';
  END IF;
  
  -- Log the action
  INSERT INTO system_logs (
    user_id,
    action,
    table_affected,
    record_id,
    details
  ) VALUES (
    v_user_id,
    'DORM_VERIFICATION_' || upper(p_new_status),
    'dorms',
    p_dorm_id::text,
    jsonb_build_object(
      'dorm_id', p_dorm_id,
      'new_status', p_new_status,
      'verified_by', v_user_id,
      'timestamp', now()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'dorm_id', p_dorm_id,
    'new_status', p_new_status
  );
END;
$$;
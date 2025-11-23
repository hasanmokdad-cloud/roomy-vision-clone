-- Add rejection tracking columns to dorms table
ALTER TABLE dorms 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Update the admin_update_verification_status function to handle rejection reasons
CREATE OR REPLACE FUNCTION public.admin_update_verification_status(
  p_dorm_id uuid, 
  p_new_status text,
  p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_updated_count integer;
BEGIN
  -- Get current user
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
  UPDATE public.dorms
  SET verification_status = p_new_status,
      rejection_reason = CASE WHEN p_new_status = 'Rejected' THEN p_rejection_reason ELSE NULL END,
      reviewed_at = now(),
      reviewed_by = v_user_id,
      updated_at = now()
  WHERE id = p_dorm_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'Dorm not found';
  END IF;
  
  -- Log the action
  INSERT INTO public.system_logs (
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
      'rejection_reason', p_rejection_reason,
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
-- Drop the 2-parameter version that's causing PGRST203 overloading conflict
-- Keep only the 3-parameter version which has DEFAULT NULL for rejection reason
DROP FUNCTION IF EXISTS public.admin_update_verification_status(uuid, text);
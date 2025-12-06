-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fix: SECURITY DEFINER view → SECURITY INVOKER
-- Fix: Storage bucket MIME types and file size limits
-- =====================================================

-- 1. Drop and recreate security_rls_overview with security_invoker
DROP VIEW IF EXISTS public.security_rls_overview;

CREATE VIEW public.security_rls_overview
WITH (security_invoker = on)
AS
SELECT 
  t.tablename AS table_name,
  t.rowsecurity AS rls_enabled,
  COALESCE(p.policy_count, 0) AS policy_count,
  COALESCE(p.select_policies, 0) AS select_policies,
  COALESCE(p.insert_policies, 0) AS insert_policies,
  COALESCE(p.update_policies, 0) AS update_policies,
  COALESCE(p.delete_policies, 0) AS delete_policies,
  CASE 
    WHEN t.tablename IN (
      'students', 'owners', 'admins', 'user_devices', 'user_presence',
      'payments', 'payment_methods', 'owner_payment_methods', 'reservations',
      'messages', 'conversations', 'personality_responses', 'friendships',
      'notifications', 'bookings', 'admin_wallet', 'billing_history',
      'payout_history', 'reservation_refunds', 'device_security_logs'
    ) THEN true
    ELSE false
  END AS is_sensitive,
  CASE 
    WHEN t.tablename IN (
      'students', 'owners', 'admins', 'user_devices', 'user_presence',
      'payments', 'payment_methods', 'owner_payment_methods', 'reservations',
      'messages', 'conversations', 'personality_responses', 'friendships',
      'notifications', 'bookings', 'admin_wallet', 'billing_history',
      'payout_history', 'reservation_refunds', 'device_security_logs'
    ) AND NOT t.rowsecurity THEN 'CRITICAL: Sensitive table without RLS'
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 'WARNING: RLS enabled but no policies'
    WHEN t.rowsecurity AND COALESCE(p.select_policies, 0) = 0 THEN 'WARNING: No SELECT policy defined'
    ELSE 'OK'
  END AS security_status
FROM pg_tables t
LEFT JOIN (
  SELECT 
    tablename,
    COUNT(*) AS policy_count,
    COUNT(*) FILTER (WHERE cmd = 'SELECT' OR cmd = '*') AS select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT' OR cmd = '*') AS insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE' OR cmd = '*') AS update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE' OR cmd = '*') AS delete_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
ORDER BY 
  CASE 
    WHEN t.tablename IN (
      'students', 'owners', 'admins', 'user_devices', 'user_presence',
      'payments', 'payment_methods', 'owner_payment_methods', 'reservations',
      'messages', 'conversations', 'personality_responses', 'friendships',
      'notifications', 'bookings', 'admin_wallet', 'billing_history',
      'payout_history', 'reservation_refunds', 'device_security_logs'
    ) AND NOT t.rowsecurity THEN 0
    WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 1
    ELSE 2
  END,
  t.tablename;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.security_rls_overview TO authenticated;

-- Add comment documenting this is a security monitoring view
COMMENT ON VIEW public.security_rls_overview IS 
  'Security monitoring view using SECURITY INVOKER to respect RLS. Shows RLS status for all public tables.';

-- 2. Apply storage bucket MIME type and file size restrictions

-- profile-photos: images only, max 10MB
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
  file_size_limit = 10485760
WHERE id = 'profile-photos';

-- room-images: images only, max 10MB
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
  file_size_limit = 10485760
WHERE id = 'room-images';

-- dorm-uploads: images + videos, max 100MB
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
  file_size_limit = 104857600
WHERE id = 'dorm-uploads';

-- message-media: images + videos, max 100MB
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
  file_size_limit = 104857600
WHERE id = 'message-media';
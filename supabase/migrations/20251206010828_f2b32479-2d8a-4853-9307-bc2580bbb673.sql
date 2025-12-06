-- Create a restricted view for messaging purposes (only exposes necessary fields)
CREATE OR REPLACE VIEW public.owner_messaging_info AS
SELECT 
  id,
  user_id,
  full_name
FROM public.owners;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.owner_messaging_info TO authenticated;

-- Drop the overly permissive RLS policy that exposes all owner data
DROP POLICY IF EXISTS "Authenticated users can view owner user_id for messaging" ON public.owners;

-- Create a more restrictive policy - only allow viewing owners users have relationships with
CREATE POLICY "Authenticated users can view owners they interact with"
ON public.owners
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- User is the owner themselves
    auth.uid() = user_id
    -- OR user is an admin
    OR EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
    -- OR user has a conversation with this owner
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE (c.user_a_id = auth.uid() AND c.user_b_id = owners.user_id)
         OR (c.user_b_id = auth.uid() AND c.user_a_id = owners.user_id)
    )
    -- OR user has a booking with this owner's dorm
    OR EXISTS (
      SELECT 1 FROM bookings b
      JOIN dorms d ON b.dorm_id = d.id
      WHERE b.student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        AND d.owner_id = owners.id
    )
  )
);
-- ============================================
-- Security Fixes Migration
-- ============================================

-- 1. Fix system_logs table (RLS enabled but no policies)
-- Admin-only SELECT, system INSERT for audit logging

CREATE POLICY "Admins can view all system logs"
ON system_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

CREATE POLICY "System can insert logs"
ON system_logs FOR INSERT
WITH CHECK (true);

-- 2. Fix personality_questions table 
-- Keep SELECT public, restrict INSERT/UPDATE/DELETE to admins only

CREATE POLICY "Admins can insert personality questions"
ON personality_questions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

CREATE POLICY "Admins can update personality questions"
ON personality_questions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

CREATE POLICY "Admins can delete personality questions"
ON personality_questions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- 3. Fix rooms table - Remove overly permissive policy that bypasses verification
-- The "Public can view rooms" USING (true) policy allows viewing ALL rooms including unverified ones
DROP POLICY IF EXISTS "Public can view rooms" ON rooms;
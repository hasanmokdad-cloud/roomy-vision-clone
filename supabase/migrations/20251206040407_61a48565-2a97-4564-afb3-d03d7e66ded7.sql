-- Fix remaining student_match_plans policies

-- Drop any existing policies on student_match_plans to start fresh
DROP POLICY IF EXISTS "Admins can view all match plans" ON public.student_match_plans;
DROP POLICY IF EXISTS "Students can view own match plans" ON public.student_match_plans;
DROP POLICY IF EXISTS "Service can insert match plans" ON public.student_match_plans;
DROP POLICY IF EXISTS "Service can update match plans" ON public.student_match_plans;

-- Recreate proper policies for student_match_plans
-- Students can view their own match plans
CREATE POLICY "Students can view own match plans"
ON public.student_match_plans
FOR SELECT
USING (student_id = public.get_current_student_id());

-- Admins can view all match plans
CREATE POLICY "Admins can view all match plans"
ON public.student_match_plans
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Service role can insert match plans (via edge functions)
CREATE POLICY "Service can insert match plans"
ON public.student_match_plans
FOR INSERT
WITH CHECK (true);

-- Service role can update match plans (via webhooks)
CREATE POLICY "Service can update match plans"
ON public.student_match_plans
FOR UPDATE
USING (true);
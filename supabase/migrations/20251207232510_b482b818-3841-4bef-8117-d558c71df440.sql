-- Fix overly permissive RLS policies by dropping them
-- The proper scoped policies already exist, we just need to remove the dangerous ones

-- 1. Drop overly permissive policy on booking_reminders (qual=true allows all access)
DROP POLICY IF EXISTS "System can manage reminders" ON public.booking_reminders;

-- 2. Drop overly permissive policies on student_match_plans
DROP POLICY IF EXISTS "System can manage match plans" ON public.student_match_plans;
DROP POLICY IF EXISTS "Service can insert match plans" ON public.student_match_plans;
DROP POLICY IF EXISTS "Service can update match plans" ON public.student_match_plans;

-- 3. Add admin management policy for booking_reminders (for edge functions that need to create reminders)
CREATE POLICY "Admins can manage all reminders"
ON public.booking_reminders
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 4. Add admin management policy for student_match_plans (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_match_plans' 
    AND policyname = 'Admins can manage all match plans'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage match plans"
    ON public.student_match_plans
    FOR ALL
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()))';
  END IF;
END $$;

-- 5. Add student update policy for student_match_plans (for tier upgrades after payment)
CREATE POLICY "Students can update own match plans"
ON public.student_match_plans
FOR UPDATE
TO authenticated
USING (student_id = public.get_current_student_id())
WITH CHECK (student_id = public.get_current_student_id());

-- 6. Add student insert policy for student_match_plans (for initial plan creation)
CREATE POLICY "Students can insert own match plans"
ON public.student_match_plans
FOR INSERT
TO authenticated
WITH CHECK (student_id = public.get_current_student_id());
-- Fix Critical: Drop overly permissive roommate_matches policy
DROP POLICY IF EXISTS "System can manage matches" ON public.roommate_matches;

-- Create properly scoped policies for roommate_matches
CREATE POLICY "Admins can manage all matches"
ON public.roommate_matches
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Students can insert own matches"
ON public.roommate_matches
FOR INSERT
WITH CHECK (
  auth.uid() = student1_id 
  OR auth.uid() = student2_id
);

CREATE POLICY "Students can update own matches"
ON public.roommate_matches
FOR UPDATE
USING (
  auth.uid() = student1_id 
  OR auth.uid() = student2_id
)
WITH CHECK (
  auth.uid() = student1_id 
  OR auth.uid() = student2_id
);

-- Fix Warning: Add SELECT policies to analytics_events
CREATE POLICY "Admins can view all analytics_events"
ON public.analytics_events
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view own analytics_events"
ON public.analytics_events
FOR SELECT
USING (auth.uid() = user_id);
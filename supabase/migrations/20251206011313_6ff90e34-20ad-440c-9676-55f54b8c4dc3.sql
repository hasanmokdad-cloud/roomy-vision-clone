-- Fix 1: Drop overly permissive user_presence policy and create restrictive one
DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;

CREATE POLICY "Users can view presence of conversation partners"
ON user_presence FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM conversations c
    WHERE (c.user_a_id = auth.uid() AND c.user_b_id = user_presence.user_id)
       OR (c.user_b_id = auth.uid() AND c.user_a_id = user_presence.user_id)
  )
);

-- Fix 2: Add SET search_path to SECURITY DEFINER functions
ALTER FUNCTION public.increment_room_occupancy(uuid) SET search_path = 'public';
ALTER FUNCTION public.decrement_room_occupancy(uuid) SET search_path = 'public';
ALTER FUNCTION public.find_next_available_slot(uuid, uuid, time, date) SET search_path = 'public';
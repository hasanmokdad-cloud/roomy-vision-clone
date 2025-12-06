
-- PHASE 1: Create Additional Security Definer Functions

-- Function to get current user's student_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1
$$;

-- Function to check if user is participant in a conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = p_conversation_id 
    AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
  )
$$;

-- Function to check if owner_id belongs to current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_owner(p_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owners 
    WHERE id = p_owner_id AND user_id = auth.uid()
  )
$$;

-- PHASE 2: Drop ALL problematic policies that cause recursion

-- Drop on owners table
DROP POLICY IF EXISTS "Conversation participants can view owners safe" ON public.owners;
DROP POLICY IF EXISTS "Students can view verified dorm owners" ON public.owners;

-- Drop on conversations table (these query owners table causing recursion)
DROP POLICY IF EXISTS "Owners can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_can_delete_own_conversations" ON public.conversations;
DROP POLICY IF EXISTS "users_can_update_own_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;

-- PHASE 3: Recreate Clean Policies Using Security Definer Functions

-- OWNERS TABLE POLICIES (non-recursive)

-- Owners can view their own profile (direct auth.uid() check, no joins)
CREATE POLICY "Owners view own profile"
ON public.owners
FOR SELECT
USING (user_id = auth.uid());

-- Students can view owners who have verified dorms (uses SECURITY DEFINER function)
CREATE POLICY "Students view verified dorm owners"
ON public.owners
FOR SELECT
USING (public.is_verified_dorm_owner(id));

-- CONVERSATIONS TABLE POLICIES (using SECURITY DEFINER functions)

-- Users can view their own conversations (using direct auth.uid() - no owner/student table joins)
CREATE POLICY "Users view own conversations safe"
ON public.conversations
FOR SELECT
USING (
  user_a_id = auth.uid() 
  OR user_b_id = auth.uid()
  OR owner_id = public.get_current_owner_id()
  OR student_id = public.get_current_student_id()
);

-- Users can update their own conversations
CREATE POLICY "Users update own conversations safe"
ON public.conversations
FOR UPDATE
USING (
  user_a_id = auth.uid() 
  OR user_b_id = auth.uid()
  OR owner_id = public.get_current_owner_id()
  OR student_id = public.get_current_student_id()
);

-- Users can delete their own conversations
CREATE POLICY "Users delete own conversations safe"
ON public.conversations
FOR DELETE
USING (
  user_a_id = auth.uid() 
  OR user_b_id = auth.uid()
  OR owner_id = public.get_current_owner_id()
  OR student_id = public.get_current_student_id()
);

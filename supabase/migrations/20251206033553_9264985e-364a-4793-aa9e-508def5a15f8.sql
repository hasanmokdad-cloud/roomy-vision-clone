-- ============================================================
-- FIX INFINITE RECURSION IN RLS POLICIES FOR OWNERS AND CONVERSATIONS
-- ============================================================

-- First, drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Authenticated users can view owners they interact with" ON public.owners;
DROP POLICY IF EXISTS "universal_view_conversations" ON public.conversations;

-- ============================================================
-- FIX OWNERS TABLE RLS - Use simple, non-recursive policies
-- ============================================================

-- Admin can view all owners (already exists but recreate for safety)
DROP POLICY IF EXISTS "Admins can view all owners" ON public.owners;
CREATE POLICY "Admins can view all owners"
ON public.owners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Owners can view their own profile (already exists but recreate for safety)
DROP POLICY IF EXISTS "Owners can view their own profile" ON public.owners;
CREATE POLICY "Owners can view their own profile"
ON public.owners
FOR SELECT
USING (user_id = auth.uid());

-- Students can view owners of dorms they are interested in (simple, non-recursive)
DROP POLICY IF EXISTS "Students can view dorm owners" ON public.owners;
CREATE POLICY "Students can view dorm owners"
ON public.owners
FOR SELECT
USING (
  id IN (
    SELECT DISTINCT d.owner_id 
    FROM public.dorms d 
    WHERE d.owner_id IS NOT NULL 
    AND d.verification_status = 'Verified'
  )
);

-- Users in conversations can view the owner they're chatting with (simple check)
DROP POLICY IF EXISTS "Conversation participants can view owner" ON public.owners;
CREATE POLICY "Conversation participants can view owner"
ON public.owners
FOR SELECT
USING (
  user_id IN (
    SELECT DISTINCT user_b_id FROM public.conversations WHERE user_a_id = auth.uid()
    UNION
    SELECT DISTINCT user_a_id FROM public.conversations WHERE user_b_id = auth.uid()
  )
);

-- ============================================================
-- FIX CONVERSATIONS TABLE RLS - Remove recursive policy
-- ============================================================

-- Simple policy: users can view conversations they are part of
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (
  user_a_id = auth.uid() 
  OR user_b_id = auth.uid()
);

-- Keep existing policies that reference student_id/owner_id directly
-- These should work without recursion since they query students/owners tables directly

-- Admins can view all conversations  
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Students can insert conversations
DROP POLICY IF EXISTS "Students can create conversations" ON public.conversations;
CREATE POLICY "Students can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- Users can update their own conversations (for archiving, pinning, muting)
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (
  user_a_id = auth.uid() OR user_b_id = auth.uid()
);

-- ============================================================
-- REFRESH EXISTING SAFE POLICIES TO ENSURE THEY WORK
-- ============================================================

-- Ensure owners update policy uses simple check
DROP POLICY IF EXISTS "Owners can update own profile" ON public.owners;
CREATE POLICY "Owners can update own profile"
ON public.owners
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure admins can update owners
DROP POLICY IF EXISTS "Admins can update owners" ON public.owners;
CREATE POLICY "Admins can update owners"
ON public.owners
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Ensure admins can delete owners
DROP POLICY IF EXISTS "Admins can delete owners" ON public.owners;
CREATE POLICY "Admins can delete owners"
ON public.owners
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
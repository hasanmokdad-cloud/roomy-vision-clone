-- PHASE 1: Create Security Definer Helper Functions
-- These functions bypass RLS to prevent recursive policy evaluation

-- Function 1: Get current user's owner_id
CREATE OR REPLACE FUNCTION public.get_current_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.owners WHERE user_id = auth.uid() LIMIT 1
$$;

-- Function 2: Check if an owner has verified dorms (for students viewing owners)
CREATE OR REPLACE FUNCTION public.is_verified_dorm_owner(p_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dorms
    WHERE owner_id = p_owner_id
    AND verification_status = 'Verified'
  )
$$;

-- Function 3: Safe check if current user owns a dorm (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_dorm_direct(p_dorm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE d.id = p_dorm_id AND o.user_id = auth.uid()
  )
$$;

-- PHASE 2: Drop Problematic RLS Policies on owners table
DROP POLICY IF EXISTS "Students can view dorm owners" ON public.owners;
DROP POLICY IF EXISTS "Conversation participants can view owner" ON public.owners;

-- PHASE 2: Drop Problematic RLS Policies on dorms table
DROP POLICY IF EXISTS "Owners can view their own dorms" ON public.dorms;
DROP POLICY IF EXISTS "Owners can update their own dorms" ON public.dorms;
DROP POLICY IF EXISTS "Owners can delete their own dorms" ON public.dorms;
DROP POLICY IF EXISTS "Owners can insert dorms" ON public.dorms;
DROP POLICY IF EXISTS "Owners can insert dorms for themselves" ON public.dorms;

-- PHASE 3: Recreate Policies Using Security Definer Functions

-- OWNERS TABLE POLICIES (non-recursive)
CREATE POLICY "Students can view verified dorm owners"
ON public.owners
FOR SELECT
USING (public.is_verified_dorm_owner(id));

CREATE POLICY "Conversation participants can view owners safe"
ON public.owners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
    AND c.owner_id = owners.id
  )
);

-- DORMS TABLE POLICIES (non-recursive using get_current_owner_id)
CREATE POLICY "Owners can view own dorms safe"
ON public.dorms
FOR SELECT
USING (owner_id = public.get_current_owner_id());

CREATE POLICY "Owners can update own dorms safe"
ON public.dorms
FOR UPDATE
USING (owner_id = public.get_current_owner_id());

CREATE POLICY "Owners can delete own dorms safe"
ON public.dorms
FOR DELETE
USING (owner_id = public.get_current_owner_id());

CREATE POLICY "Owners can insert own dorms safe"
ON public.dorms
FOR INSERT
WITH CHECK (owner_id = public.get_current_owner_id());
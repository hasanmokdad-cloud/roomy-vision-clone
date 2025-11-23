-- Fix rooms table RLS policies with proper structure

-- Drop all existing policies on rooms table
DROP POLICY IF EXISTS "Owners can insert rooms for their dorms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can view their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can update their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can delete their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can manage all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can manage their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view available rooms" ON public.rooms;

-- Create helper function to check if user owns the dorm
CREATE OR REPLACE FUNCTION public.user_owns_dorm(p_dorm_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE d.id = p_dorm_id
      AND o.user_id = auth.uid()
  );
$$;

-- Insert policy for owners
CREATE POLICY "Owners can insert rooms"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (public.user_owns_dorm(dorm_id));

-- Select policy for owners
CREATE POLICY "Owners can view rooms"
ON public.rooms
FOR SELECT
TO authenticated
USING (public.user_owns_dorm(dorm_id));

-- Update policy for owners
CREATE POLICY "Owners can update rooms"
ON public.rooms
FOR UPDATE
TO authenticated
USING (public.user_owns_dorm(dorm_id))
WITH CHECK (public.user_owns_dorm(dorm_id));

-- Delete policy for owners
CREATE POLICY "Owners can delete rooms"
ON public.rooms
FOR DELETE
TO authenticated
USING (public.user_owns_dorm(dorm_id));

-- Admin policy - full access
CREATE POLICY "Admins have full access"
ON public.rooms
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public can view available rooms in verified dorms
CREATE POLICY "Public can view available rooms"
ON public.rooms
FOR SELECT
TO authenticated, anon
USING (
  available = true AND
  dorm_id IN (
    SELECT id FROM dorms 
    WHERE verification_status = 'Verified' AND available = true
  )
);
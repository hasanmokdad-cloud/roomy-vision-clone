-- PHASE 1: Fix signup by ensuring no old role column or enum references exist

-- Drop any old triggers that might be inserting with 'role' column
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Ensure user_roles only has role_id (nullable) and no 'role' column
-- The role_id being nullable allows Lovable auth to create users without explicit role assignment
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.user_roles DROP COLUMN role;
  END IF;
END $$;

-- Clean up old app_role enum if it exists
DROP TYPE IF EXISTS public.app_role CASCADE;

-- PHASE 2: Create rooms table for dorm room management
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- single, double, triple, studio, etc
  price NUMERIC NOT NULL,
  area_m2 NUMERIC,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Students and guests can SELECT rooms for public verified dorms
CREATE POLICY "Public can view rooms for verified dorms"
ON public.rooms
FOR SELECT
USING (
  dorm_id IN (
    SELECT id FROM public.dorms 
    WHERE verification_status = 'Verified' AND available = true
  )
);

-- Owners can manage rooms for their own dorms
CREATE POLICY "Owners can manage their dorm rooms"
ON public.rooms
FOR ALL
USING (
  dorm_id IN (
    SELECT d.id FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
)
WITH CHECK (
  dorm_id IN (
    SELECT d.id FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Admins can manage all rooms
CREATE POLICY "Admins can manage all rooms"
ON public.rooms
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS rooms_dorm_id_idx ON public.rooms(dorm_id);
CREATE INDEX IF NOT EXISTS rooms_type_idx ON public.rooms(type);

-- PHASE 3: Clean up old role data - keep only admin, owner, student
DELETE FROM public.roles WHERE name NOT IN ('admin', 'owner', 'student');

-- Ensure all three required roles exist
INSERT INTO public.roles (name) 
VALUES ('admin'), ('owner'), ('student')
ON CONFLICT (name) DO NOTHING;
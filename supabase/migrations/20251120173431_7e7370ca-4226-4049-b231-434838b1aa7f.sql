-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert all possible roles from the enum
INSERT INTO public.roles (name) VALUES 
  ('admin'),
  ('moderator'),
  ('user'),
  ('owner'),
  ('student')
ON CONFLICT (name) DO NOTHING;

-- Add role_id column to user_roles as NULLABLE first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.user_roles ADD COLUMN role_id UUID REFERENCES public.roles(id);
  END IF;
END $$;

-- Migrate existing data from role enum to role_id
UPDATE public.user_roles ur
SET role_id = (
  SELECT r.id 
  FROM public.roles r 
  WHERE r.name = ur.role::text
)
WHERE ur.role_id IS NULL;

-- Verify all rows have role_id before setting NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role_id IS NULL) THEN
    ALTER TABLE public.user_roles ALTER COLUMN role_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some user_roles rows still have NULL role_id - skipping NOT NULL constraint';
  END IF;
END $$;

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read roles (needed for login/signup flows)
CREATE POLICY "Anyone can view roles"
ON public.roles
FOR SELECT
USING (true);

-- Update has_role function to work with role_id
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.name = _role_name
  )
$$;
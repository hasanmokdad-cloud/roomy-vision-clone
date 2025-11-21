-- Create dorm_claims table for pending ownership claims
CREATE TABLE IF NOT EXISTS public.dorm_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  proof_of_ownership TEXT,
  contact_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dorm_claims ENABLE ROW LEVEL SECURITY;

-- Owners can insert their own claims
CREATE POLICY "Owners can create claims"
ON public.dorm_claims
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

-- Owners can view their own claims
CREATE POLICY "Owners can view own claims"
ON public.dorm_claims
FOR SELECT
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

-- Admins can view all claims
CREATE POLICY "Admins can view all claims"
ON public.dorm_claims
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  )
);

-- Admins can update all claims
CREATE POLICY "Admins can update claims"
ON public.dorm_claims
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  )
);

-- Update RLS policies for dorms table

-- Owners can INSERT their own dorms
DROP POLICY IF EXISTS "Owners can insert dorms" ON public.dorms;
CREATE POLICY "Owners can insert dorms"
ON public.dorms
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

-- Owners can SELECT their own dorms
DROP POLICY IF EXISTS "Owners can view their own dorms" ON public.dorms;
CREATE POLICY "Owners can view their own dorms"
ON public.dorms
FOR SELECT
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

-- Owners can UPDATE their own dorms
DROP POLICY IF EXISTS "Owners can update their own dorms" ON public.dorms;
CREATE POLICY "Owners can update their own dorms"
ON public.dorms
FOR UPDATE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

-- Admins can manage all dorms
DROP POLICY IF EXISTS "Admins can manage all dorms" ON public.dorms;
CREATE POLICY "Admins can manage all dorms"
ON public.dorms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
  )
);

-- Create trigger for updated_at on dorm_claims
CREATE TRIGGER update_dorm_claims_updated_at
BEFORE UPDATE ON public.dorm_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
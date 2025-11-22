-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view verified available dorms" ON public.dorms;

-- Drop the old public-only policy
DROP POLICY IF EXISTS "Public can view verified available dorms" ON public.dorms;

-- Create a single unified policy for both public and authenticated users
CREATE POLICY "Anyone can view verified available dorms"
  ON public.dorms
  FOR SELECT
  TO public, authenticated
  USING (
    verification_status = 'Verified' AND available = true
  );
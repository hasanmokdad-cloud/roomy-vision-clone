-- Add policy for authenticated users to view verified available dorms
CREATE POLICY "Authenticated users can view verified available dorms"
  ON public.dorms
  FOR SELECT
  TO authenticated
  USING (
    verification_status = 'Verified' AND available = true
  );
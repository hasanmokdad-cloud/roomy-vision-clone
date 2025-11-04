-- Create policy to allow public read access to verified and available dorms
CREATE POLICY "Public can view verified available dorms"
ON public.dorms
FOR SELECT
USING (
  verification_status = 'Verified' 
  AND available = true
);
-- Drop the existing constraint
ALTER TABLE public.dorms 
DROP CONSTRAINT IF EXISTS dorms_verification_status_check;

-- Create new constraint with 'Rejected' included
ALTER TABLE public.dorms 
ADD CONSTRAINT dorms_verification_status_check 
CHECK (verification_status = ANY (ARRAY['Verified'::text, 'Pending'::text, 'Unverified'::text, 'Rejected'::text]));
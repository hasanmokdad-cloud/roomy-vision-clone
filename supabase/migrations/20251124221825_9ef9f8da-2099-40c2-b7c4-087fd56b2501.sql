-- Make university and monthly_price nullable in dorms table
-- These fields are redundant as price is in rooms and university is not needed at dorm level

-- Alter the columns to be nullable (they might already be nullable, but ensuring consistency)
ALTER TABLE public.dorms 
  ALTER COLUMN university DROP NOT NULL,
  ALTER COLUMN monthly_price DROP NOT NULL,
  ALTER COLUMN price DROP NOT NULL;

-- Add comments to clarify these fields are deprecated
COMMENT ON COLUMN public.dorms.university IS 'DEPRECATED: University association is now optional - dorms can serve multiple universities';
COMMENT ON COLUMN public.dorms.monthly_price IS 'DEPRECATED: Price information is stored in individual rooms, not at dorm level';
COMMENT ON COLUMN public.dorms.price IS 'DEPRECATED: Price information is stored in individual rooms, not at dorm level';
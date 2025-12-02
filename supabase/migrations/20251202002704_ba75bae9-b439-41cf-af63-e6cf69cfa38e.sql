-- Add commission_amount and total_amount columns to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC;

COMMENT ON COLUMN reservations.commission_amount IS '10% commission charged on the deposit';
COMMENT ON COLUMN reservations.total_amount IS 'Total amount charged (deposit + commission)';
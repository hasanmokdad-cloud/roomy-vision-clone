-- Add expires_at column to reservations table for payment URL expiry
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying expired reservations
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at ON reservations(expires_at) WHERE status = 'pending_payment';
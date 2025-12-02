-- Add payout fields to owners table
ALTER TABLE owners ADD COLUMN IF NOT EXISTS whish_account_id TEXT;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_connected' CHECK (payout_status IN ('not_connected', 'pending_verification', 'active', 'suspended'));
ALTER TABLE owners ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'whish_wallet' CHECK (payout_method IN ('whish_wallet', 'bank_transfer'));
ALTER TABLE owners ADD COLUMN IF NOT EXISTS payout_notes TEXT;

-- Add payout tracking fields to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS owner_payout_amount NUMERIC;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS owner_payout_status TEXT DEFAULT 'not_scheduled' CHECK (owner_payout_status IN ('not_scheduled', 'pending', 'processing', 'paid', 'failed'));
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS owner_payout_timestamp TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS owner_payout_attempts INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS roomy_commission_captured BOOLEAN DEFAULT false;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payout_batch_id TEXT;

-- Create index for faster payout queries
CREATE INDEX IF NOT EXISTS idx_reservations_owner_payout_status ON reservations(owner_payout_status);
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_owners_payout_status ON owners(payout_status);
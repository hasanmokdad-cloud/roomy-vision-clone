-- Add latest_refund_status to reservations table for tracking refund workflow
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS latest_refund_status TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN reservations.latest_refund_status IS 'Tracks refund status: pending_owner, pending_admin, approved, rejected, refunded, failed';

-- Update refund_requests table to support new statuses
-- Add owner_decision column if not exists
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS owner_decision TEXT DEFAULT NULL;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS owner_decision_note TEXT DEFAULT NULL;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS admin_decision TEXT DEFAULT NULL;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS admin_decision_note TEXT DEFAULT NULL;
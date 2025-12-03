-- Add columns to refund_requests table for enhanced refund tracking
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS base_deposit NUMERIC;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS total_paid NUMERIC;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS refund_owner_amount NUMERIC;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS refund_admin_amount NUMERIC;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS admin_decision TEXT;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS admin_decision_note TEXT;

-- Create RPC function to decrement owner balance
CREATE OR REPLACE FUNCTION public.decrement_owner_balance(p_owner_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE owner_payment_methods
  SET balance = GREATEST(COALESCE(balance, 0) - p_amount, 0),
      updated_at = now()
  WHERE owner_id = p_owner_id AND is_default = true;
END;
$$;

-- Create RPC function to decrement admin balance
CREATE OR REPLACE FUNCTION public.decrement_admin_balance(p_admin_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE admin_wallet
  SET balance = GREATEST(COALESCE(balance, 0) - p_amount, 0),
      updated_at = now()
  WHERE admin_id = p_admin_id;
END;
$$;

-- Add RLS policy for admins to manage all refund requests
CREATE POLICY "Admins can manage all refund requests"
ON refund_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
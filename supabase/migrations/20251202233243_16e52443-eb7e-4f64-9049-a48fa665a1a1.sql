-- Add new columns to owner_payment_methods
ALTER TABLE owner_payment_methods 
ADD COLUMN IF NOT EXISTS exp_month INTEGER,
ADD COLUMN IF NOT EXISTS exp_year INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Lebanon',
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

-- Create admin_income_history table to track Roomy's 10% commission
CREATE TABLE IF NOT EXISTS admin_income_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),
  student_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  commission_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'captured' CHECK (status IN ('pending', 'captured', 'failed')),
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_income_history
ALTER TABLE admin_income_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all income history
CREATE POLICY "Admins can view all income history" ON admin_income_history
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- System can insert income history
CREATE POLICY "System can insert income history" ON admin_income_history
  FOR INSERT WITH CHECK (true);

-- Create function to increment owner balance
CREATE OR REPLACE FUNCTION increment_owner_balance(p_owner_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE owner_payment_methods
  SET balance = COALESCE(balance, 0) + p_amount,
      updated_at = now()
  WHERE owner_id = p_owner_id AND is_default = true;
END;
$$;
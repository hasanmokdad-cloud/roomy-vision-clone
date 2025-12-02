-- Create admin_wallet table
CREATE TABLE IF NOT EXISTS public.admin_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  whish_token TEXT,
  card_last4 TEXT,
  card_brand TEXT,
  card_country TEXT DEFAULT 'Lebanon',
  exp_month INTEGER,
  exp_year INTEGER,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only ONE card per admin (enforce uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS admin_wallet_admin_id_unique ON public.admin_wallet(admin_id);

-- Enable RLS
ALTER TABLE public.admin_wallet ENABLE ROW LEVEL SECURITY;

-- Admin can only access their own wallet
CREATE POLICY "Admins can manage their own wallet" ON public.admin_wallet
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create balance increment function for admin
CREATE OR REPLACE FUNCTION public.increment_admin_balance(p_admin_id UUID, p_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_wallet
  SET balance = COALESCE(balance, 0) + p_amount,
      updated_at = now()
  WHERE admin_id = p_admin_id;
END;
$$;
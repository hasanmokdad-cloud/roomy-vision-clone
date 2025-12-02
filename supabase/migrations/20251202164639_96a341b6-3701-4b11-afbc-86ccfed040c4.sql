-- Create owner_payment_methods table
CREATE TABLE public.owner_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  whish_token TEXT NOT NULL,
  brand TEXT DEFAULT 'Whish',
  last4 TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payout_history table
CREATE TABLE public.payout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  dorm_id UUID NOT NULL REFERENCES public.dorms(id),
  deposit_amount NUMERIC NOT NULL,
  roomy_fee NUMERIC NOT NULL,
  owner_receives NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_id UUID REFERENCES public.payments(id),
  reservation_id UUID REFERENCES public.reservations(id),
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on owner_payment_methods
ALTER TABLE public.owner_payment_methods ENABLE ROW LEVEL SECURITY;

-- Owners can view their own payout cards
CREATE POLICY "Owners can view own payout cards"
  ON public.owner_payment_methods FOR SELECT
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Owners can insert their own payout cards
CREATE POLICY "Owners can insert own payout cards"
  ON public.owner_payment_methods FOR INSERT
  WITH CHECK (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Owners can update their own payout cards
CREATE POLICY "Owners can update own payout cards"
  ON public.owner_payment_methods FOR UPDATE
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Owners can delete their own payout cards
CREATE POLICY "Owners can delete own payout cards"
  ON public.owner_payment_methods FOR DELETE
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Admins can view all owner payment methods
CREATE POLICY "Admins can view all owner payment methods"
  ON public.owner_payment_methods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- Enable RLS on payout_history
ALTER TABLE public.payout_history ENABLE ROW LEVEL SECURITY;

-- Owners see their own payouts
CREATE POLICY "Owners see own payouts"
  ON public.payout_history FOR SELECT
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- Admins see all payouts
CREATE POLICY "Admins see all payouts"
  ON public.payout_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- System can insert payout history
CREATE POLICY "System can insert payout history"
  ON public.payout_history FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_owner_payment_methods_owner_id ON public.owner_payment_methods(owner_id);
CREATE INDEX idx_payout_history_owner_id ON public.payout_history(owner_id);
CREATE INDEX idx_payout_history_created_at ON public.payout_history(created_at DESC);
-- Create reservations table for room reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending_payment', 'paid', 'cancelled', 'expired')) DEFAULT 'pending_payment',
  deposit_amount NUMERIC NOT NULL,
  reservation_fee_amount NUMERIC NOT NULL,
  whish_payment_id TEXT,
  whish_checkout_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  meta JSONB
);

-- Create payments table for all payment transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('reservation', 'match_plan')),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  match_plan_type TEXT CHECK (match_plan_type IN ('basic', 'advanced', 'vip')),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  provider TEXT DEFAULT 'whish',
  whish_payment_id TEXT,
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_match_plans table for AI Match plan subscriptions
CREATE TABLE IF NOT EXISTS public.student_match_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'advanced', 'vip')),
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  meta JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_student ON public.reservations(student_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON public.reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dorm ON public.reservations(dorm_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_match_plans_student ON public.student_match_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_match_plans_status ON public.student_match_plans(status);
CREATE INDEX IF NOT EXISTS idx_match_plans_expires ON public.student_match_plans(expires_at);

-- Enable RLS on all new tables
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_match_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations
CREATE POLICY "Students can view their own reservations"
  ON public.reservations FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create their own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Owners can view reservations for their dorm rooms"
  ON public.reservations FOR SELECT
  USING (dorm_id IN (SELECT id FROM public.dorms WHERE owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid())));

CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin'));

CREATE POLICY "System can manage reservations"
  ON public.reservations FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payments
CREATE POLICY "Students can view their own payments"
  ON public.payments FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin'));

CREATE POLICY "System can manage payments"
  ON public.payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for student_match_plans
CREATE POLICY "Students can view their own match plans"
  ON public.student_match_plans FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all match plans"
  ON public.student_match_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON ur.role_id = r.id WHERE ur.user_id = auth.uid() AND r.name = 'admin'));

CREATE POLICY "System can manage match plans"
  ON public.student_match_plans FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update payments.updated_at
CREATE OR REPLACE FUNCTION public.update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_updated_at();
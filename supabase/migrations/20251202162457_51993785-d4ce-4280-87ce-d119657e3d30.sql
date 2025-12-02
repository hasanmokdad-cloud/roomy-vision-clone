-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  whish_token TEXT NOT NULL,
  brand TEXT DEFAULT 'Whish',
  last4 TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create billing_history table
CREATE TABLE public.billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  payment_method_last4 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

-- payment_methods RLS policies
CREATE POLICY "Students can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can delete their own payment methods"
  ON public.payment_methods FOR DELETE
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all payment methods"
  ON public.payment_methods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- billing_history RLS policies
CREATE POLICY "Students can view own billing history"
  ON public.billing_history FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "System can insert billing history"
  ON public.billing_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all billing history"
  ON public.billing_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- Create indexes for performance
CREATE INDEX idx_payment_methods_student_id ON public.payment_methods(student_id);
CREATE INDEX idx_payment_methods_is_default ON public.payment_methods(student_id, is_default);
CREATE INDEX idx_billing_history_student_id ON public.billing_history(student_id);
CREATE INDEX idx_billing_history_created_at ON public.billing_history(created_at DESC);
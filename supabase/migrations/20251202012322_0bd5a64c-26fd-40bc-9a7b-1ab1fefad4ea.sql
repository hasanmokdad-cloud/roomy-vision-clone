-- Add refundable_until column to reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS refundable_until TIMESTAMPTZ;

-- Create refund_requests table
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  reason TEXT,
  owner_decision TEXT,
  owner_decision_note TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID
);

-- Enable RLS on refund_requests
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- Students can create and view their own refund requests
CREATE POLICY "Students manage own refund requests" 
  ON refund_requests FOR ALL 
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Owners can view refund requests for their dorms
CREATE POLICY "Owners view their refund requests" 
  ON refund_requests FOR SELECT 
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- Owners can update refund requests (approve/reject)
CREATE POLICY "Owners update their refund requests" 
  ON refund_requests FOR UPDATE 
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- Admins have full access
CREATE POLICY "Admins manage all refund requests" 
  ON refund_requests FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));

-- Create payment_disputes table
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  issue_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'open' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

-- Enable RLS on payment_disputes
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

-- Students can create and view their own disputes
CREATE POLICY "Students manage own disputes" 
  ON payment_disputes FOR ALL 
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Owners can view disputes for their dorms
CREATE POLICY "Owners view their disputes" 
  ON payment_disputes FOR SELECT 
  USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- Admins have full access
CREATE POLICY "Admins manage all disputes" 
  ON payment_disputes FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ));
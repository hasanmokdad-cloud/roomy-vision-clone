-- Phase 1: Database Schema Updates for Room Occupancy System

-- 1. Create room_occupancy_claims table to track student claims before owner confirmation
CREATE TABLE public.room_occupancy_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  claim_type TEXT NOT NULL DEFAULT 'legacy' CHECK (claim_type IN ('legacy', 'reservation')),
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, room_id) -- One claim per student per room
);

-- 2. Add roomy_confirmed_occupants to rooms table (tracks spots filled via Roomy reservations)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS roomy_confirmed_occupants INTEGER DEFAULT 0;

-- 3. Add confirmation columns to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS room_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS room_confirmed_at TIMESTAMPTZ;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS confirmation_type TEXT CHECK (confirmation_type IN ('reservation', 'legacy_claim'));

-- 4. Enable RLS on room_occupancy_claims
ALTER TABLE public.room_occupancy_claims ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for room_occupancy_claims

-- Students can view their own claims
CREATE POLICY "Students can view own claims"
ON public.room_occupancy_claims
FOR SELECT
USING (student_id = get_current_student_id());

-- Students can create their own claims
CREATE POLICY "Students can create own claims"
ON public.room_occupancy_claims
FOR INSERT
WITH CHECK (student_id = get_current_student_id());

-- Students can update their own pending claims
CREATE POLICY "Students can update own pending claims"
ON public.room_occupancy_claims
FOR UPDATE
USING (student_id = get_current_student_id() AND status = 'pending');

-- Students can delete their own pending claims
CREATE POLICY "Students can delete own pending claims"
ON public.room_occupancy_claims
FOR DELETE
USING (student_id = get_current_student_id() AND status = 'pending');

-- Owners can view claims for their dorms
CREATE POLICY "Owners can view claims for their dorms"
ON public.room_occupancy_claims
FOR SELECT
USING (owner_id = get_current_owner_id());

-- Owners can update claims for their dorms (confirm/reject)
CREATE POLICY "Owners can update claims for their dorms"
ON public.room_occupancy_claims
FOR UPDATE
USING (owner_id = get_current_owner_id());

-- Admins can manage all claims
CREATE POLICY "Admins can manage all claims"
ON public.room_occupancy_claims
FOR ALL
USING (is_admin(auth.uid()));

-- 6. Create trigger to update updated_at
CREATE TRIGGER update_room_occupancy_claims_updated_at
BEFORE UPDATE ON public.room_occupancy_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create index for performance
CREATE INDEX idx_room_occupancy_claims_room_id ON public.room_occupancy_claims(room_id);
CREATE INDEX idx_room_occupancy_claims_owner_id ON public.room_occupancy_claims(owner_id);
CREATE INDEX idx_room_occupancy_claims_status ON public.room_occupancy_claims(status);
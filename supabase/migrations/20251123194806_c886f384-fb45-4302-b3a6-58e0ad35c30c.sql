-- Create room_contact_tracking table to track student interest in rooms
CREATE TABLE IF NOT EXISTS public.room_contact_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  student_name TEXT,
  student_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.room_contact_tracking ENABLE ROW LEVEL SECURITY;

-- Admins can view all contact tracking
CREATE POLICY "Admins can view all contact tracking"
ON public.room_contact_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Owners can view contact tracking for their dorms
CREATE POLICY "Owners can view their dorm contact tracking"
ON public.room_contact_tracking
FOR SELECT
USING (
  dorm_id IN (
    SELECT d.id FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Students can insert their own contact tracking
CREATE POLICY "Students can insert contact tracking"
ON public.room_contact_tracking
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_room_contact_tracking_room_id ON public.room_contact_tracking(room_id);
CREATE INDEX IF NOT EXISTS idx_room_contact_tracking_dorm_id ON public.room_contact_tracking(dorm_id);
CREATE INDEX IF NOT EXISTS idx_room_contact_tracking_student_id ON public.room_contact_tracking(student_id);
-- Create bookings table for viewing requests
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dorm_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  owner_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'declined', 'cancelled', 'completed'))
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Students can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can cancel their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (status = 'cancelled');

CREATE POLICY "Owners can view bookings for their dorms"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update bookings for their dorms"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.owners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add read status to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Create index for unread messages query performance
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status, owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(requested_date, requested_time);
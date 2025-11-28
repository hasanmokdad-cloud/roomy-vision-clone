-- Create SECURITY DEFINER function to check owner-student relationship
CREATE OR REPLACE FUNCTION public.owner_can_view_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings b
    JOIN owners o ON b.owner_id = o.id
    WHERE b.student_id = p_student_id
    AND o.user_id = auth.uid()
  )
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Owners can view students for their bookings" ON public.students;

-- Create new policy using the SECURITY DEFINER function
CREATE POLICY "Owners can view students for their bookings" ON public.students
FOR SELECT TO authenticated
USING (public.owner_can_view_student(id));

-- Add missing foreign key from bookings to students (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_bookings_student' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT fk_bookings_student 
    FOREIGN KEY (student_id) REFERENCES public.students(id);
  END IF;
END $$;

-- Add missing foreign key from bookings to dorms (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_bookings_dorm' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT fk_bookings_dorm 
    FOREIGN KEY (dorm_id) REFERENCES public.dorms(id);
  END IF;
END $$;
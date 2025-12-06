-- =============================================
-- SECURITY HARDENING: Fix payments and reservations policies
-- =============================================

-- 1. FIX: Drop overly permissive payments policy
DROP POLICY IF EXISTS "System can manage payments" ON public.payments;

-- 2. Add INSERT policy for students (system operations via service_role bypass RLS anyway)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Students can insert payments'
  ) THEN
    CREATE POLICY "Students can insert payments"
    ON public.payments FOR INSERT
    WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
  END IF;
END $$;

-- 3. FIX: Drop overly permissive reservations policy  
DROP POLICY IF EXISTS "System can manage reservations" ON public.reservations;

-- 4. Add UPDATE policy for students to update their own reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' AND policyname = 'Students can update their own reservations'
  ) THEN
    CREATE POLICY "Students can update their own reservations"
    ON public.reservations FOR UPDATE
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
  END IF;
END $$;

-- 5. Add UPDATE policy for owners to update reservations for their dorms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' AND policyname = 'Owners can update reservations for their dorms'
  ) THEN
    CREATE POLICY "Owners can update reservations for their dorms"
    ON public.reservations FOR UPDATE
    USING (dorm_id IN (
      SELECT dorms.id FROM dorms 
      WHERE dorms.owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
    ));
  END IF;
END $$;

-- 6. Add admin UPDATE policy for reservations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' AND policyname = 'Admins can update all reservations'
  ) THEN
    CREATE POLICY "Admins can update all reservations"
    ON public.reservations FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
      )
    );
  END IF;
END $$;
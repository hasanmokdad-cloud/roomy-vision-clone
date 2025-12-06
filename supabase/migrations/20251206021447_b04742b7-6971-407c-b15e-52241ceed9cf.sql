-- =============================================
-- SECURITY HARDENING: Fix remaining policies
-- =============================================

-- 1. FIX CRITICAL: Drop the overly permissive user_devices policy
DROP POLICY IF EXISTS "System can manage devices" ON public.user_devices;

-- 2. Add INSERT policy for users (only if not exists - use CREATE OR REPLACE pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_devices' AND policyname = 'Users can insert own devices'
  ) THEN
    CREATE POLICY "Users can insert own devices"
    ON public.user_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Add UPDATE policy for users (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_devices' AND policyname = 'Users can update own devices'
  ) THEN
    CREATE POLICY "Users can update own devices"
    ON public.user_devices FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================
-- STRENGTHEN inquiries table policies
-- =============================================

-- 4. Add admin SELECT policy for inquiries (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inquiries' AND policyname = 'Admins can view all inquiries'
  ) THEN
    CREATE POLICY "Admins can view all inquiries"
    ON public.inquiries FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = 'admin'
      )
    );
  END IF;
END $$;

-- 5. Add owner UPDATE policy for inquiries (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inquiries' AND policyname = 'Owners can update their inquiries'
  ) THEN
    CREATE POLICY "Owners can update their inquiries"
    ON public.inquiries FOR UPDATE
    USING (
      owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- 6. Add student UPDATE policy for inquiries (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inquiries' AND policyname = 'Students can update their own inquiries'
  ) THEN
    CREATE POLICY "Students can update their own inquiries"
    ON public.inquiries FOR UPDATE
    USING (
      student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- 7. Add student DELETE policy for inquiries (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'inquiries' AND policyname = 'Students can delete their own inquiries'
  ) THEN
    CREATE POLICY "Students can delete their own inquiries"
    ON public.inquiries FOR DELETE
    USING (
      student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );
  END IF;
END $$;
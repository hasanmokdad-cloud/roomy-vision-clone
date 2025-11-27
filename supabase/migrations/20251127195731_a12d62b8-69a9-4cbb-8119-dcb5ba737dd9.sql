-- Add missing columns to bookings table for tour functionality
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Drop existing policies if they exist before recreating
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Owners can view tour bookings for their dorms" ON tour_bookings;
DROP POLICY IF EXISTS "Owners can update tour bookings" ON tour_bookings;

-- Add admin RLS policy for bookings
CREATE POLICY "Admins can view all bookings" ON bookings
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid() AND r.name = 'admin'
));

-- Add owner SELECT policy for tour_bookings
CREATE POLICY "Owners can view tour bookings for their dorms" ON tour_bookings
FOR SELECT TO authenticated
USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));

-- Add owner UPDATE policy for tour_bookings
CREATE POLICY "Owners can update tour bookings" ON tour_bookings
FOR UPDATE TO authenticated
USING (owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid()));
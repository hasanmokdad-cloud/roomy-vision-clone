-- ============================================
-- PHASE 1: EXTEND BEDS TABLE
-- ============================================

-- Add room_id for dorm rooms (beds can belong to rooms OR bedrooms)
ALTER TABLE beds ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;

-- Add availability tracking columns
ALTER TABLE beds ADD COLUMN IF NOT EXISTS parent_type TEXT DEFAULT 'bedroom';
ALTER TABLE beds ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';
ALTER TABLE beds ADD COLUMN IF NOT EXISTS reserved_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE beds ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;
ALTER TABLE beds ADD COLUMN IF NOT EXISTS occupied_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE beds ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add constraint for availability_status values
ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_availability_status_check;
ALTER TABLE beds ADD CONSTRAINT beds_availability_status_check 
  CHECK (availability_status IN ('available', 'reserved', 'occupied', 'unavailable'));

-- Make bedroom_id nullable (now optional - can be room_id OR bedroom_id)
ALTER TABLE beds ALTER COLUMN bedroom_id DROP NOT NULL;

-- Create trigger function to validate bed parent (exactly one parent)
CREATE OR REPLACE FUNCTION validate_bed_parent()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow both to be null during migration, but set parent_type appropriately
  IF NEW.room_id IS NOT NULL AND NEW.bedroom_id IS NOT NULL THEN
    RAISE EXCEPTION 'Bed cannot have both room_id and bedroom_id';
  END IF;
  
  -- Set parent_type based on which parent is set
  IF NEW.room_id IS NOT NULL THEN
    NEW.parent_type := 'room';
  ELSIF NEW.bedroom_id IS NOT NULL THEN
    NEW.parent_type := 'bedroom';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_bed_parent ON beds;
CREATE TRIGGER check_bed_parent
  BEFORE INSERT OR UPDATE ON beds
  FOR EACH ROW EXECUTE FUNCTION validate_bed_parent();

-- Create indexes for availability checks
CREATE INDEX IF NOT EXISTS idx_beds_availability ON beds(availability_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_beds_reserved_by ON beds(reserved_by_user_id) WHERE reserved_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_beds_occupied_by ON beds(occupied_by_user_id) WHERE occupied_by_user_id IS NOT NULL;

-- ============================================
-- PHASE 2: EXTEND RESERVATIONS TABLE
-- ============================================

-- Add reservation_group_id for grouping multi-bed reservations (full apartment)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reservation_group_id UUID;

-- Add building_id reference
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES dorms(id);

-- Add platform fee tracking
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC;

-- Add payment provider for future-proofing
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'whish';
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_payment_provider_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_payment_provider_check 
  CHECK (payment_provider IN ('whish', 'manual', 'none'));

-- Create index for reservation groups
CREATE INDEX IF NOT EXISTS idx_reservations_group ON reservations(reservation_group_id) WHERE reservation_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_bed_status ON reservations(bed_id, status) WHERE bed_id IS NOT NULL;

-- ============================================
-- PHASE 3: EXTEND STUDENTS TABLE
-- ============================================

-- Add apartment assignment tracking
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_apartment_id UUID REFERENCES apartments(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_bedroom_id UUID REFERENCES bedrooms(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_bed_id UUID REFERENCES beds(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS accommodation_locked BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS accommodation_locked_at TIMESTAMPTZ;

-- ============================================
-- PHASE 4: RPC FUNCTIONS
-- ============================================

-- 4.1 reserve_bed - Atomic bed reservation
CREATE OR REPLACE FUNCTION reserve_bed(
  p_bed_id UUID,
  p_user_id UUID,
  p_hold_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_bed RECORD;
  v_student_id UUID;
  v_building_id UUID;
  v_deposit NUMERIC;
  v_platform_fee NUMERIC;
  v_total NUMERIC;
  v_reservation_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get student ID
  SELECT id INTO v_student_id FROM students WHERE user_id = p_user_id;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student profile not found');
  END IF;

  -- Check if student has existing pending reservation
  IF EXISTS (
    SELECT 1 FROM reservations 
    WHERE student_id = v_student_id 
    AND status = 'pending_payment'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have a pending reservation. Complete or cancel it first.');
  END IF;

  -- Lock the bed row for update (prevents race conditions)
  SELECT b.*, 
    COALESCE(
      (SELECT d.id FROM rooms r JOIN dorms d ON r.dorm_id = d.id WHERE r.id = b.room_id),
      (SELECT d.id FROM bedrooms br JOIN apartments a ON br.apartment_id = a.id JOIN dorms d ON a.building_id = d.id WHERE br.id = b.bedroom_id)
    ) as computed_building_id
  INTO v_bed
  FROM beds b
  WHERE b.id = p_bed_id
  FOR UPDATE;

  IF v_bed IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bed not found');
  END IF;

  -- Check availability
  IF v_bed.availability_status != 'available' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Bed is not available',
      'status', v_bed.availability_status
    );
  END IF;

  IF NOT COALESCE(v_bed.is_active, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bed is not active');
  END IF;

  v_building_id := v_bed.computed_building_id;

  -- Calculate pricing
  v_deposit := COALESCE(v_bed.deposit, v_bed.monthly_price, 0);
  v_platform_fee := ROUND(v_deposit * 0.10, 2);
  v_total := v_deposit + v_platform_fee;
  v_expires_at := NOW() + (p_hold_minutes || ' minutes')::INTERVAL;

  -- Mark bed as reserved
  UPDATE beds SET
    availability_status = 'reserved',
    reserved_by_user_id = p_user_id,
    reserved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_bed_id;

  -- Create reservation record
  INSERT INTO reservations (
    student_id,
    bed_id,
    room_id,
    apartment_id,
    bedroom_id,
    dorm_id,
    building_id,
    reservation_level,
    status,
    deposit_amount,
    platform_fee_amount,
    reservation_fee_amount,
    commission_amount,
    total_amount,
    expires_at,
    payment_provider
  ) VALUES (
    v_student_id,
    p_bed_id,
    v_bed.room_id,
    NULL,
    v_bed.bedroom_id,
    v_building_id,
    v_building_id,
    'bed',
    'pending_payment',
    v_deposit,
    v_platform_fee,
    v_platform_fee,
    v_platform_fee,
    v_total,
    v_expires_at,
    'whish'
  )
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'bed_id', p_bed_id,
    'deposit_amount', v_deposit,
    'platform_fee', v_platform_fee,
    'total_amount', v_total,
    'expires_at', v_expires_at
  );
END;
$$;

-- 4.2 reserve_full_apartment - Atomic multi-bed reservation
CREATE OR REPLACE FUNCTION reserve_full_apartment(
  p_apartment_id UUID,
  p_user_id UUID,
  p_hold_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_id UUID;
  v_building_id UUID;
  v_bed_record RECORD;
  v_bed_count INTEGER := 0;
  v_unavailable_count INTEGER := 0;
  v_total_deposit NUMERIC := 0;
  v_platform_fee NUMERIC;
  v_total NUMERIC;
  v_reservation_group_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_reservation_ids UUID[] := ARRAY[]::UUID[];
  v_reservation_id UUID;
BEGIN
  -- Get student ID
  SELECT id INTO v_student_id FROM students WHERE user_id = p_user_id;
  IF v_student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student profile not found');
  END IF;

  -- Check existing pending reservation
  IF EXISTS (
    SELECT 1 FROM reservations 
    WHERE student_id = v_student_id 
    AND status = 'pending_payment'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have a pending reservation');
  END IF;

  -- Get building_id
  SELECT building_id INTO v_building_id 
  FROM apartments WHERE id = p_apartment_id;
  
  IF v_building_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apartment not found');
  END IF;

  -- Count beds and check availability (with lock)
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE availability_status != 'available' OR NOT COALESCE(is_active, true))
  INTO v_bed_count, v_unavailable_count
  FROM beds b
  JOIN bedrooms br ON b.bedroom_id = br.id
  WHERE br.apartment_id = p_apartment_id
  FOR UPDATE OF b;

  -- A1 Rule: ALL beds must be available
  IF v_unavailable_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cannot reserve full apartment - some beds are unavailable',
      'unavailable_count', v_unavailable_count,
      'total_beds', v_bed_count
    );
  END IF;

  IF v_bed_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apartment has no beds configured');
  END IF;

  -- Generate group ID and calculate timing
  v_reservation_group_id := gen_random_uuid();
  v_expires_at := NOW() + (p_hold_minutes || ' minutes')::INTERVAL;

  -- Process each bed individually
  FOR v_bed_record IN 
    SELECT b.id as bed_id, b.bedroom_id, COALESCE(b.deposit, b.monthly_price, 0) as bed_deposit
    FROM beds b
    JOIN bedrooms br ON b.bedroom_id = br.id
    WHERE br.apartment_id = p_apartment_id
    FOR UPDATE OF b
  LOOP
    v_total_deposit := v_total_deposit + v_bed_record.bed_deposit;
    
    -- Mark bed as reserved
    UPDATE beds SET
      availability_status = 'reserved',
      reserved_by_user_id = p_user_id,
      reserved_at = NOW(),
      updated_at = NOW()
    WHERE id = v_bed_record.bed_id;

    -- Create individual reservation record for this bed
    INSERT INTO reservations (
      student_id,
      bed_id,
      bedroom_id,
      apartment_id,
      dorm_id,
      building_id,
      reservation_group_id,
      reservation_level,
      status,
      deposit_amount,
      platform_fee_amount,
      reservation_fee_amount,
      commission_amount,
      total_amount,
      expires_at,
      payment_provider
    ) VALUES (
      v_student_id,
      v_bed_record.bed_id,
      v_bed_record.bedroom_id,
      p_apartment_id,
      v_building_id,
      v_building_id,
      v_reservation_group_id,
      'bed',
      'pending_payment',
      v_bed_record.bed_deposit,
      ROUND(v_bed_record.bed_deposit * 0.10, 2),
      ROUND(v_bed_record.bed_deposit * 0.10, 2),
      ROUND(v_bed_record.bed_deposit * 0.10, 2),
      v_bed_record.bed_deposit + ROUND(v_bed_record.bed_deposit * 0.10, 2),
      v_expires_at,
      'whish'
    )
    RETURNING id INTO v_reservation_id;
    
    v_reservation_ids := array_append(v_reservation_ids, v_reservation_id);
  END LOOP;

  v_platform_fee := ROUND(v_total_deposit * 0.10, 2);
  v_total := v_total_deposit + v_platform_fee;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_group_id', v_reservation_group_id,
    'reservation_ids', v_reservation_ids,
    'apartment_id', p_apartment_id,
    'bed_count', v_bed_count,
    'deposit_amount', v_total_deposit,
    'platform_fee', v_platform_fee,
    'total_amount', v_total,
    'expires_at', v_expires_at
  );
END;
$$;

-- 4.3 can_reserve_full_apartment - Fast check helper
CREATE OR REPLACE FUNCTION can_reserve_full_apartment(p_apartment_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    NOT EXISTS (
      SELECT 1 FROM beds b
      JOIN bedrooms br ON b.bedroom_id = br.id
      WHERE br.apartment_id = p_apartment_id
      AND (
        b.availability_status != 'available' 
        OR NOT COALESCE(b.is_active, true)
      )
    )
    AND EXISTS (
      SELECT 1 FROM beds b
      JOIN bedrooms br ON b.bedroom_id = br.id
      WHERE br.apartment_id = p_apartment_id
    );
$$;

-- 4.4 cleanup_expired_reservations - Admin cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_reservation RECORD;
BEGIN
  -- Find and process expired pending_payment reservations
  FOR v_reservation IN 
    SELECT id, bed_id
    FROM reservations
    WHERE status = 'pending_payment'
    AND expires_at < NOW()
    FOR UPDATE
  LOOP
    -- Mark reservation as expired
    UPDATE reservations SET status = 'expired', updated_at = NOW() WHERE id = v_reservation.id;
    
    -- Release the bed
    IF v_reservation.bed_id IS NOT NULL THEN
      UPDATE beds SET
        availability_status = 'available',
        reserved_by_user_id = NULL,
        reserved_at = NULL,
        updated_at = NOW()
      WHERE id = v_reservation.bed_id
      AND availability_status = 'reserved';
    END IF;
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN v_expired_count;
END;
$$;

-- 4.5 finalize_reservation - On payment success
CREATE OR REPLACE FUNCTION finalize_reservation(
  p_reservation_id UUID,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reservation RECORD;
  v_bed RECORD;
  v_building_id UUID;
  v_room_id UUID;
  v_apartment_id UUID;
  v_bedroom_id UUID;
  v_bed_id UUID;
BEGIN
  -- Lock and get reservation
  SELECT * INTO v_reservation 
  FROM reservations 
  WHERE id = p_reservation_id 
  FOR UPDATE;

  IF v_reservation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation not found');
  END IF;

  IF v_reservation.status != 'pending_payment' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reservation is not pending payment');
  END IF;

  -- Update reservation status
  UPDATE reservations SET
    status = 'reserved',
    whish_payment_id = COALESCE(p_payment_reference, whish_payment_id),
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_reservation_id;

  -- If this is part of a group, finalize all reservations in the group
  IF v_reservation.reservation_group_id IS NOT NULL THEN
    UPDATE reservations SET
      status = 'reserved',
      whish_payment_id = COALESCE(p_payment_reference, whish_payment_id),
      paid_at = NOW(),
      updated_at = NOW()
    WHERE reservation_group_id = v_reservation.reservation_group_id
    AND status = 'pending_payment';
  END IF;

  -- Get assignment details from bed
  SELECT bedroom_id, room_id INTO v_bedroom_id, v_room_id
  FROM beds WHERE id = v_reservation.bed_id;
  
  v_bed_id := v_reservation.bed_id;
  v_apartment_id := v_reservation.apartment_id;
  v_building_id := v_reservation.building_id;

  -- Update student profile
  UPDATE students SET
    accommodation_status = CASE 
      WHEN v_apartment_id IS NOT NULL THEN 'have_apartment' 
      ELSE 'have_dorm' 
    END,
    current_dorm_id = v_building_id,
    current_room_id = v_room_id,
    current_apartment_id = v_apartment_id,
    current_bedroom_id = v_bedroom_id,
    current_bed_id = v_bed_id,
    accommodation_locked = true,
    accommodation_locked_at = NOW(),
    room_confirmed = true,
    room_confirmed_at = NOW(),
    confirmation_type = 'reservation',
    updated_at = NOW()
  WHERE id = v_reservation.student_id;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'accommodation_status', CASE WHEN v_apartment_id IS NOT NULL THEN 'have_apartment' ELSE 'have_dorm' END
  );
END;
$$;

-- 4.6 student_checkout_extended - Extended checkout
CREATE OR REPLACE FUNCTION student_checkout_extended(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student RECORD;
BEGIN
  -- Get student with current assignments
  SELECT * INTO v_student 
  FROM students 
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_student IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student not found');
  END IF;

  -- Release occupied/reserved beds assigned to this user
  UPDATE beds SET
    availability_status = 'available',
    occupied_by_user_id = NULL,
    reserved_by_user_id = NULL,
    reserved_at = NULL,
    updated_at = NOW()
  WHERE (occupied_by_user_id = p_user_id OR reserved_by_user_id = p_user_id);

  -- Clear student assignment
  UPDATE students SET
    accommodation_status = 'need_dorm',
    current_dorm_id = NULL,
    current_room_id = NULL,
    current_apartment_id = NULL,
    current_bedroom_id = NULL,
    current_bed_id = NULL,
    accommodation_locked = false,
    accommodation_locked_at = NULL,
    room_confirmed = false,
    room_confirmed_at = NULL,
    confirmation_type = NULL,
    updated_at = NOW()
  WHERE id = v_student.id;

  -- Update related reservations to completed
  UPDATE reservations SET
    status = 'completed',
    updated_at = NOW()
  WHERE student_id = v_student.id
  AND status = 'reserved';

  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student.id,
    'message', 'Checkout completed successfully'
  );
END;
$$;

-- ============================================
-- PHASE 5: AVAILABILITY VIEWS
-- ============================================

-- 5.1 Room Inventory Summary (for Dorm Rooms)
CREATE OR REPLACE VIEW room_inventory_summary AS
SELECT 
  r.id,
  r.dorm_id as building_id,
  r.name,
  r.type,
  r.capacity,
  COUNT(b.id) as total_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) as available_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'reserved') as reserved_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'occupied') as occupied_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) = COUNT(b.id) 
    AND COUNT(b.id) > 0 as is_fully_available,
  COUNT(b.id) FILTER (WHERE b.availability_status IN ('reserved', 'occupied')) = COUNT(b.id) 
    AND COUNT(b.id) > 0 as is_full
FROM rooms r
LEFT JOIN beds b ON b.room_id = r.id
GROUP BY r.id;

-- 5.2 Apartment Inventory Summary
CREATE OR REPLACE VIEW apartment_inventory_summary AS
SELECT 
  a.id,
  a.building_id,
  a.name,
  COUNT(DISTINCT br.id) as total_bedrooms,
  COUNT(b.id) as total_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) as available_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'reserved') as reserved_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'occupied') as occupied_beds,
  COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) = COUNT(b.id) 
    AND COUNT(b.id) > 0 as can_reserve_full_apartment,
  CASE 
    WHEN COUNT(b.id) = 0 THEN 'no_beds'
    WHEN COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) = COUNT(b.id) THEN 'available'
    WHEN COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) > 0 THEN 'partially_filled'
    ELSE 'full'
  END as availability_status
FROM apartments a
LEFT JOIN bedrooms br ON br.apartment_id = a.id
LEFT JOIN beds b ON b.bedroom_id = br.id
GROUP BY a.id;

-- 5.3 Building Inventory Summary
CREATE OR REPLACE VIEW building_inventory_summary AS
WITH room_beds AS (
  SELECT 
    d.id as building_id, 
    COUNT(b.id) FILTER (WHERE COALESCE(b.is_active, true)) as total, 
    COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) as available,
    COUNT(b.id) FILTER (WHERE b.availability_status = 'reserved') as reserved,
    COUNT(b.id) FILTER (WHERE b.availability_status = 'occupied') as occupied
  FROM dorms d
  LEFT JOIN rooms r ON r.dorm_id = d.id
  LEFT JOIN beds b ON b.room_id = r.id
  GROUP BY d.id
),
apt_beds AS (
  SELECT 
    d.id as building_id, 
    COUNT(b.id) FILTER (WHERE COALESCE(b.is_active, true)) as total,
    COUNT(b.id) FILTER (WHERE b.availability_status = 'available' AND COALESCE(b.is_active, true)) as available,
    COUNT(b.id) FILTER (WHERE b.availability_status = 'reserved') as reserved,
    COUNT(b.id) FILTER (WHERE b.availability_status = 'occupied') as occupied
  FROM dorms d
  LEFT JOIN apartments a ON a.building_id = d.id
  LEFT JOIN bedrooms br ON br.apartment_id = a.id
  LEFT JOIN beds b ON b.bedroom_id = br.id
  GROUP BY d.id
)
SELECT 
  d.id,
  d.name,
  d.property_type,
  d.owner_id,
  COALESCE(rb.total, 0) + COALESCE(ab.total, 0) as total_beds,
  COALESCE(rb.available, 0) + COALESCE(ab.available, 0) as available_beds,
  COALESCE(rb.reserved, 0) + COALESCE(ab.reserved, 0) as reserved_beds,
  COALESCE(rb.occupied, 0) + COALESCE(ab.occupied, 0) as occupied_beds,
  CASE 
    WHEN COALESCE(rb.total, 0) + COALESCE(ab.total, 0) = 0 THEN 0
    ELSE ROUND(
      ((COALESCE(rb.occupied, 0) + COALESCE(ab.occupied, 0))::NUMERIC / 
       (COALESCE(rb.total, 0) + COALESCE(ab.total, 0))::NUMERIC) * 100, 1
    )
  END as occupancy_rate
FROM dorms d
LEFT JOIN room_beds rb ON rb.building_id = d.id
LEFT JOIN apt_beds ab ON ab.building_id = d.id;

-- ============================================
-- PHASE 6: RLS POLICIES FOR BEDS
-- ============================================

-- Enable RLS on beds if not already
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view active beds" ON beds;
DROP POLICY IF EXISTS "Owners can manage beds" ON beds;
DROP POLICY IF EXISTS "Students can view their assigned beds" ON beds;

-- Public read for active beds (listings)
CREATE POLICY "Public can view active beds" ON beds
  FOR SELECT USING (COALESCE(is_active, true) = true);

-- Owners can manage beds for their properties
CREATE POLICY "Owners can manage beds" ON beds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN dorms d ON r.dorm_id = d.id
      JOIN owners o ON d.owner_id = o.id
      WHERE r.id = beds.room_id AND o.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM bedrooms br
      JOIN apartments a ON br.apartment_id = a.id
      JOIN dorms d ON a.building_id = d.id
      JOIN owners o ON d.owner_id = o.id
      WHERE br.id = beds.bedroom_id AND o.user_id = auth.uid()
    )
  );

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION reserve_bed TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_full_apartment TO authenticated;
GRANT EXECUTE ON FUNCTION can_reserve_full_apartment TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION student_checkout_extended TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_reservations TO authenticated;
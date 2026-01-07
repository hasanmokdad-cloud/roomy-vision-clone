-- Add bed_type column to rooms table (descriptive only)
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS bed_type TEXT DEFAULT 'single';

COMMENT ON COLUMN rooms.bed_type IS 
  'Descriptive only - does NOT affect capacity. Capacity is owner-defined.';

-- Add index for pending reservations (for conflict detection)
CREATE INDEX IF NOT EXISTS idx_reservations_pending_conflict 
ON reservations(room_id, apartment_id, bedroom_id, bed_id, status, expires_at) 
WHERE status IN ('pending_payment', 'pending');

-- Ensure expires_at exists on reservations (should already exist)
-- Add if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE reservations ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- Create pricing_rules table for tiered pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('room', 'apartment', 'bedroom')),
  scope_id UUID NOT NULL,
  occupancy_count INTEGER NOT NULL,
  price_mode TEXT NOT NULL DEFAULT 'per_bed' CHECK (price_mode IN ('per_bed', 'per_resident', 'per_apartment')),
  monthly_price NUMERIC NOT NULL,
  deposit NUMERIC,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for pricing_rules
CREATE INDEX IF NOT EXISTS idx_pricing_rules_scope ON pricing_rules(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_occupancy ON pricing_rules(scope_id, occupancy_count);

-- Enable RLS on pricing_rules
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Public read access for active pricing rules
CREATE POLICY "Public can read active pricing rules" ON pricing_rules
  FOR SELECT USING (is_active = true);

-- Owners can manage pricing rules for their properties
CREATE POLICY "Owners can manage pricing rules" ON pricing_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dorms d
      JOIN owners o ON d.owner_id = o.id
      WHERE o.user_id = auth.uid()
      AND (
        (scope_type = 'room' AND d.id IN (SELECT dorm_id FROM rooms WHERE id = scope_id))
        OR (scope_type = 'apartment' AND d.id IN (SELECT building_id FROM apartments WHERE id = scope_id))
        OR (scope_type = 'bedroom' AND d.id IN (
          SELECT a.building_id FROM apartments a 
          JOIN bedrooms b ON b.apartment_id = a.id 
          WHERE b.id = scope_id
        ))
      )
    )
  );

-- Add trigger for updated_at on pricing_rules
CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER trigger_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_pricing_rules_updated_at();
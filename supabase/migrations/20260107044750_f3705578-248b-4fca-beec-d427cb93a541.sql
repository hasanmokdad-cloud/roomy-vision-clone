-- Add FLEX MODE columns to apartments table
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS 
  enable_full_apartment_reservation BOOLEAN DEFAULT true;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS 
  enable_bedroom_reservation BOOLEAN DEFAULT true;
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS 
  enable_bed_reservation BOOLEAN DEFAULT false;

-- Create beds table for individual bed configuration
CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bedroom_id UUID NOT NULL REFERENCES bedrooms(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Bed',
  bed_type TEXT NOT NULL DEFAULT 'single',
  capacity_contribution INTEGER NOT NULL DEFAULT 1,
  monthly_price NUMERIC,
  deposit NUMERIC,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on beds
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- RLS policies for beds (inherit from apartment/bedroom ownership chain)
CREATE POLICY "Owners can manage their beds" ON beds
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bedrooms br
    JOIN apartments a ON br.apartment_id = a.id
    JOIN dorms d ON a.building_id = d.id
    WHERE br.id = beds.bedroom_id AND d.owner_id IN (
      SELECT id FROM owners WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Public can view available beds" ON beds
FOR SELECT USING (available = true);

-- Add reservation level tracking to reservations table
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS reservation_level TEXT DEFAULT 'room',
  ADD COLUMN IF NOT EXISTS apartment_id UUID REFERENCES apartments(id),
  ADD COLUMN IF NOT EXISTS bedroom_id UUID REFERENCES bedrooms(id),
  ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES beds(id),
  ADD COLUMN IF NOT EXISTS occupancy_count INTEGER DEFAULT 1;

-- Create index for faster availability queries
CREATE INDEX IF NOT EXISTS idx_beds_bedroom_id ON beds(bedroom_id);
CREATE INDEX IF NOT EXISTS idx_reservations_apartment_id ON reservations(apartment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_bedroom_id ON reservations(bedroom_id);
CREATE INDEX IF NOT EXISTS idx_reservations_bed_id ON reservations(bed_id);
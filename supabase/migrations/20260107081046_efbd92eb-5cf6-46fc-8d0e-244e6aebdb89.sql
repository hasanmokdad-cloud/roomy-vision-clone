-- Create apartment_photos table for categorized photos
CREATE TABLE IF NOT EXISTS public.apartment_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  space_type TEXT NOT NULL CHECK (space_type IN ('living_room', 'bedroom', 'kitchen', 'bathroom', 'balcony', 'dining', 'workspace', 'entrance', 'exterior', 'other')),
  space_instance TEXT,
  sort_order INTEGER DEFAULT 0,
  caption TEXT,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create apartment_spaces table for space metadata
CREATE TABLE IF NOT EXISTS public.apartment_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  space_type TEXT NOT NULL CHECK (space_type IN ('living_room', 'bedroom', 'kitchen', 'bathroom', 'balcony', 'dining', 'workspace', 'entrance', 'exterior', 'other')),
  space_instance TEXT,
  meta_json JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extend apartments table with additional fields
ALTER TABLE public.apartments
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS house_rules TEXT[],
ADD COLUMN IF NOT EXISTS safety_features TEXT[],
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS bathroom_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS guest_capacity INTEGER,
ADD COLUMN IF NOT EXISTS amenities TEXT[];

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_apartment_photos_apartment ON public.apartment_photos(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_photos_space ON public.apartment_photos(space_type, space_instance);
CREATE INDEX IF NOT EXISTS idx_apartment_spaces_apartment ON public.apartment_spaces(apartment_id);

-- Enable RLS on new tables
ALTER TABLE public.apartment_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartment_spaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for apartment_photos
CREATE POLICY "Public can view apartment photos"
ON public.apartment_photos FOR SELECT
USING (true);

CREATE POLICY "Owners can manage their apartment photos"
ON public.apartment_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.dorms d ON d.id = a.building_id
    WHERE a.id = apartment_photos.apartment_id
    AND d.owner_id IN (
      SELECT id FROM public.owners WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for apartment_spaces
CREATE POLICY "Public can view apartment spaces"
ON public.apartment_spaces FOR SELECT
USING (true);

CREATE POLICY "Owners can manage their apartment spaces"
ON public.apartment_spaces FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.dorms d ON d.id = a.building_id
    WHERE a.id = apartment_spaces.apartment_id
    AND d.owner_id IN (
      SELECT id FROM public.owners WHERE user_id = auth.uid()
    )
  )
);
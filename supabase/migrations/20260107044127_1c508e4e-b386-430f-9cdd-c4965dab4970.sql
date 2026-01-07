-- Add property_type column to dorms table
ALTER TABLE public.dorms ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'dorm';

-- Create apartments table
CREATE TABLE public.apartments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.dorms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  max_capacity INTEGER NOT NULL DEFAULT 2,
  enabled_capacities INTEGER[] DEFAULT ARRAY[1, 2],
  enable_tiered_pricing BOOLEAN DEFAULT false,
  area_m2 NUMERIC,
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create apartment_pricing_tiers table
CREATE TABLE public.apartment_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL,
  monthly_price NUMERIC NOT NULL,
  deposit NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(apartment_id, capacity)
);

-- Create bedrooms table
CREATE TABLE public.bedrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bed_type TEXT NOT NULL DEFAULT 'single',
  base_capacity INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  allow_extra_beds BOOLEAN DEFAULT false,
  pricing_mode TEXT NOT NULL DEFAULT 'per_bedroom',
  bedroom_price NUMERIC,
  bedroom_deposit NUMERIC,
  bed_price NUMERIC,
  bed_deposit NUMERIC,
  images TEXT[] DEFAULT '{}',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on apartments
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

-- Apartments policies
CREATE POLICY "Apartments are viewable by everyone"
ON public.apartments FOR SELECT
USING (true);

CREATE POLICY "Owners can insert apartments for their buildings"
ON public.apartments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE d.id = building_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update their apartments"
ON public.apartments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE d.id = building_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their apartments"
ON public.apartments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE d.id = building_id AND o.user_id = auth.uid()
  )
);

-- Enable RLS on apartment_pricing_tiers
ALTER TABLE public.apartment_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Apartment pricing tiers policies
CREATE POLICY "Apartment pricing tiers are viewable by everyone"
ON public.apartment_pricing_tiers FOR SELECT
USING (true);

CREATE POLICY "Owners can manage apartment pricing tiers"
ON public.apartment_pricing_tiers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.dorms d ON a.building_id = d.id
    JOIN public.owners o ON d.owner_id = o.id
    WHERE a.id = apartment_id AND o.user_id = auth.uid()
  )
);

-- Enable RLS on bedrooms
ALTER TABLE public.bedrooms ENABLE ROW LEVEL SECURITY;

-- Bedrooms policies
CREATE POLICY "Bedrooms are viewable by everyone"
ON public.bedrooms FOR SELECT
USING (true);

CREATE POLICY "Owners can insert bedrooms for their apartments"
ON public.bedrooms FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.dorms d ON a.building_id = d.id
    JOIN public.owners o ON d.owner_id = o.id
    WHERE a.id = apartment_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update their bedrooms"
ON public.bedrooms FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.dorms d ON a.building_id = d.id
    JOIN public.owners o ON d.owner_id = o.id
    WHERE a.id = apartment_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete their bedrooms"
ON public.bedrooms FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.apartments a
    JOIN public.dorms d ON a.building_id = d.id
    JOIN public.owners o ON d.owner_id = o.id
    WHERE a.id = apartment_id AND o.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_apartments_building_id ON public.apartments(building_id);
CREATE INDEX idx_apartment_pricing_tiers_apartment_id ON public.apartment_pricing_tiers(apartment_id);
CREATE INDEX idx_bedrooms_apartment_id ON public.bedrooms(apartment_id);

-- Create updated_at triggers
CREATE TRIGGER update_apartments_updated_at
BEFORE UPDATE ON public.apartments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bedrooms_updated_at
BEFORE UPDATE ON public.bedrooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
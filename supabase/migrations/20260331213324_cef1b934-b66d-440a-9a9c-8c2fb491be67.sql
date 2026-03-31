
-- Add reception columns to dorms
ALTER TABLE public.dorms
  ADD COLUMN IF NOT EXISTS has_reception boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reception_per_block boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rules_and_regulations text DEFAULT NULL;

-- Create building_images table for section-based photo storage
CREATE TABLE public.building_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE CASCADE NOT NULL,
  section_type text NOT NULL,
  sort_order int DEFAULT 0,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.building_images ENABLE ROW LEVEL SECURITY;

-- Owners can manage their own building images
CREATE POLICY "Owners can manage own building images"
ON public.building_images
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE d.id = building_images.dorm_id
    AND o.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dorms d
    JOIN public.owners o ON d.owner_id = o.id
    WHERE d.id = building_images.dorm_id
    AND o.user_id = auth.uid()
  )
);

-- Public can view building images
CREATE POLICY "Public can view building images"
ON public.building_images
FOR SELECT
TO anon, authenticated
USING (true);

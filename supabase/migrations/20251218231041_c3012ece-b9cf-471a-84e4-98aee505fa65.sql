-- Add preferred_city and preferred_areas columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS preferred_city text,
ADD COLUMN IF NOT EXISTS preferred_areas text[];

-- Add comment for documentation
COMMENT ON COLUMN public.students.preferred_city IS 'Student preferred city: Byblos or Beirut';
COMMENT ON COLUMN public.students.preferred_areas IS 'Array of preferred housing areas within the selected city';
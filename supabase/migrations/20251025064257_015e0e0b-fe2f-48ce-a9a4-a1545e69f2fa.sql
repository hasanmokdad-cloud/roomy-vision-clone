-- Extend students table with AI preference fields
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS favorite_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_room_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_confidence_score INTEGER DEFAULT 50 CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100);

-- Add index for fast AI preference queries
CREATE INDEX IF NOT EXISTS idx_students_preferences 
ON public.students USING GIN (favorite_areas, preferred_room_types, preferred_amenities);

-- Create preference history tracking table
CREATE TABLE IF NOT EXISTS public.preference_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on preference_history
ALTER TABLE public.preference_history ENABLE ROW LEVEL SECURITY;

-- Students can view their own preference history
CREATE POLICY "Students can view their own preference history"
ON public.preference_history
FOR SELECT
USING (student_id IN (
  SELECT id FROM public.students WHERE user_id = auth.uid()
));

-- System can insert preference history
CREATE POLICY "System can insert preference history"
ON public.preference_history
FOR INSERT
WITH CHECK (true);

-- Create function to update student preferences
CREATE OR REPLACE FUNCTION public.update_student_preference(
  p_student_id UUID,
  p_preference_type TEXT,
  p_value TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the appropriate preference array based on type
  IF p_preference_type = 'area' THEN
    UPDATE students
    SET favorite_areas = array_append(
      CASE WHEN p_value = ANY(favorite_areas) THEN favorite_areas
      ELSE favorite_areas END, 
      p_value
    ),
    ai_confidence_score = LEAST(ai_confidence_score + 2, 100),
    updated_at = now()
    WHERE id = p_student_id
    AND p_value != ALL(COALESCE(favorite_areas, '{}'));
    
  ELSIF p_preference_type = 'room_type' THEN
    UPDATE students
    SET preferred_room_types = array_append(
      CASE WHEN p_value = ANY(preferred_room_types) THEN preferred_room_types
      ELSE preferred_room_types END,
      p_value
    ),
    ai_confidence_score = LEAST(ai_confidence_score + 2, 100),
    updated_at = now()
    WHERE id = p_student_id
    AND p_value != ALL(COALESCE(preferred_room_types, '{}'));
    
  ELSIF p_preference_type = 'amenity' THEN
    UPDATE students
    SET preferred_amenities = array_append(
      CASE WHEN p_value = ANY(preferred_amenities) THEN preferred_amenities
      ELSE preferred_amenities END,
      p_value
    ),
    ai_confidence_score = LEAST(ai_confidence_score + 2, 100),
    updated_at = now()
    WHERE id = p_student_id
    AND p_value != ALL(COALESCE(preferred_amenities, '{}'));
  END IF;
  
  -- Log the preference change
  INSERT INTO preference_history (student_id, preference_type, value)
  VALUES (p_student_id, p_preference_type, p_value);
END;
$$;

-- Create function to reset student AI memory
CREATE OR REPLACE FUNCTION public.reset_student_ai_memory(p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE students
  SET 
    favorite_areas = '{}',
    preferred_room_types = '{}',
    preferred_amenities = '{}',
    ai_confidence_score = 50,
    updated_at = now()
  WHERE id = p_student_id;
  
  -- Clear preference history
  DELETE FROM preference_history WHERE student_id = p_student_id;
END;
$$;
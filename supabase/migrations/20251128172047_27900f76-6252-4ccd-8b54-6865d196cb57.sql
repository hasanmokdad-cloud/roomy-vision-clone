-- Create personality_questions table
CREATE TABLE IF NOT EXISTS personality_questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lifestyle', 'study_work', 'personality', 'similarity', 'advanced')),
  subcategory TEXT,
  weight FLOAT NOT NULL DEFAULT 1.0,
  is_advanced BOOLEAN DEFAULT false,
  display_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create personality_responses table
CREATE TABLE IF NOT EXISTS personality_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id INT NOT NULL REFERENCES personality_questions(id) ON DELETE CASCADE,
  response INT NOT NULL CHECK (response >= 1 AND response <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create roommate_matches table
CREATE TABLE IF NOT EXISTS roommate_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student1_id UUID NOT NULL,
  student2_id UUID NOT NULL,
  compatibility_score FLOAT NOT NULL,
  lifestyle_score FLOAT,
  study_score FLOAT,
  personality_score FLOAT,
  similarity_score FLOAT,
  advanced_score FLOAT,
  match_reasons JSONB,
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student1_id, student2_id)
);

-- Add new columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS advanced_compatibility_enabled BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS compatibility_test_completed BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE personality_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roommate_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personality_questions
CREATE POLICY "Anyone can view personality questions"
ON personality_questions FOR SELECT
USING (true);

-- RLS Policies for personality_responses
CREATE POLICY "Users can view own responses"
ON personality_responses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
ON personality_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
ON personality_responses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses"
ON personality_responses FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON personality_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- RLS Policies for roommate_matches
CREATE POLICY "Users can view their own matches"
ON roommate_matches FOR SELECT
USING (auth.uid() = student1_id OR auth.uid() = student2_id);

CREATE POLICY "System can manage matches"
ON roommate_matches FOR ALL
USING (true)
WITH CHECK (true);

-- Seed personality questions (35 total)
INSERT INTO personality_questions (text, category, subcategory, weight, is_advanced, display_order) VALUES
-- Section A: Lifestyle Compatibility (10 questions)
('I am generally a clean and organized person', 'lifestyle', 'cleanliness', 1.5, false, 1),
('I wash dishes and clean shared areas without reminders', 'lifestyle', 'cleanliness', 1.5, false, 2),
('I don''t mind if my roommate is less clean than me', 'lifestyle', 'cleanliness', 1.3, false, 3),
('I prefer a quiet environment most of the time', 'lifestyle', 'noise', 1.4, false, 4),
('I am okay with noise (music, calls, etc.) during the day', 'lifestyle', 'noise', 1.3, false, 5),
('I wake up early (before 9 AM)', 'lifestyle', 'schedule', 1.2, false, 6),
('I stay up late (after 12 AM)', 'lifestyle', 'schedule', 1.2, false, 7),
('I prefer hosting guests frequently', 'lifestyle', 'social', 1.1, false, 8),
('I am comfortable if my roommate has guests', 'lifestyle', 'social', 1.1, false, 9),
('I am comfortable sharing my belongings', 'lifestyle', 'sharing', 1.0, false, 10),

-- Section B: Study & Work Style (4 questions)
('I study or work from my room regularly', 'study_work', 'work_habits', 1.2, false, 11),
('I need silence when studying/working', 'study_work', 'environment', 1.3, false, 12),
('I don''t mind different study schedules', 'study_work', 'flexibility', 1.1, false, 13),
('I am okay with remote-class/call activity in the room', 'study_work', 'environment', 1.2, false, 14),

-- Section C: Personality Traits (8 questions)
('I consider myself an extrovert', 'personality', 'extraversion', 1.0, false, 15),
('I enjoy spending time alone', 'personality', 'introversion', 1.0, false, 16),
('I get stressed/anxious easily', 'personality', 'neuroticism', 1.2, false, 17),
('I handle conflicts calmly', 'personality', 'agreeableness', 1.3, false, 18),
('I am open to new experiences', 'personality', 'openness', 1.0, false, 19),
('I prefer a structured routine', 'personality', 'conscientiousness', 1.1, false, 20),
('I adapt easily to changes', 'personality', 'flexibility', 1.1, false, 21),
('I avoid drama and confrontations', 'personality', 'agreeableness', 1.3, false, 22),

-- Section D: Roommate Similarity Preference (3 questions)
('I prefer a roommate who is similar to me', 'similarity', 'preference', 1.4, false, 23),
('I am okay living with someone who is different', 'similarity', 'tolerance', 1.2, false, 24),
('I would like a sociable/friendly roommate', 'similarity', 'social', 1.3, false, 25),

-- Advanced Section (10 questions)
('I smoke / I am okay with a roommate who smokes', 'advanced', 'substance', 1.5, true, 26),
('I drink alcohol / I am okay with a roommate who drinks', 'advanced', 'substance', 1.3, true, 27),
('I am comfortable with roommates of different religions/cultures', 'advanced', 'diversity', 1.0, true, 28),
('I am okay with roommates'' overnight guests', 'advanced', 'privacy', 1.2, true, 29),
('I am okay sharing food and groceries', 'advanced', 'sharing', 1.0, true, 30),
('I prefer warm rooms (AC/heater usage preference)', 'advanced', 'temperature', 0.8, true, 31),
('I am comfortable living around pets', 'advanced', 'pets', 1.0, true, 32),
('I am sensitive to scents (perfume, incense, etc.)', 'advanced', 'environment', 0.9, true, 33),
('I prefer the room temperature to be cold', 'advanced', 'temperature', 0.8, true, 34),
('I prefer the lights off at night', 'advanced', 'sleep', 1.0, true, 35);

-- Create index for better query performance
CREATE INDEX idx_personality_responses_user_id ON personality_responses(user_id);
CREATE INDEX idx_personality_responses_question_id ON personality_responses(question_id);
CREATE INDEX idx_roommate_matches_students ON roommate_matches(student1_id, student2_id);

-- Create trigger to update updated_at on personality_responses
CREATE OR REPLACE FUNCTION update_personality_response_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personality_response_updated_at
BEFORE UPDATE ON personality_responses
FOR EACH ROW
EXECUTE FUNCTION update_personality_response_updated_at();
-- Add personality preference columns to students table

-- Lifestyle & Daily Rhythm
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_sleep_schedule TEXT 
  CHECK (personality_sleep_schedule IN ('early', 'regular', 'late'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_noise_tolerance TEXT 
  CHECK (personality_noise_tolerance IN ('very_quiet', 'quiet', 'normal', 'loud'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_guests_frequency TEXT 
  CHECK (personality_guests_frequency IN ('never', 'rarely', 'sometimes', 'often'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_cleanliness_level TEXT 
  CHECK (personality_cleanliness_level IN ('very_clean', 'clean', 'average', 'messy'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_shared_space_cleanliness_importance INTEGER 
  CHECK (personality_shared_space_cleanliness_importance BETWEEN 1 AND 5);

-- Study & Work Style
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_study_time TEXT 
  CHECK (personality_study_time IN ('morning', 'afternoon', 'evening', 'late_night'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_study_environment TEXT 
  CHECK (personality_study_environment IN ('silent', 'quiet', 'moderate_noise', 'flexible'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_sleep_sensitivity TEXT 
  CHECK (personality_sleep_sensitivity IN ('very_light', 'light', 'normal', 'heavy'));

-- Social & Compatibility
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_intro_extro TEXT 
  CHECK (personality_intro_extro IN ('introvert', 'ambivert', 'extrovert'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_conflict_style TEXT 
  CHECK (personality_conflict_style IN ('avoidant', 'direct', 'compromise', 'assertive'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_sharing_preferences TEXT 
  CHECK (personality_sharing_preferences IN ('minimal', 'moderate', 'anything_shared'));

-- Habits
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_smoking TEXT 
  CHECK (personality_smoking IN ('yes', 'no'));

ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_cooking_frequency TEXT 
  CHECK (personality_cooking_frequency IN ('never', 'rarely', 'sometimes', 'often'));

-- Meta fields
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_vector JSONB DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_last_updated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS ai_match_tier_last_paid_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for faster personality queries
CREATE INDEX IF NOT EXISTS idx_students_personality_completed ON students(personality_test_completed) 
  WHERE personality_test_completed = true;
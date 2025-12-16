-- Add onboarding completion tracking to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add lifestyle/personality fields if they don't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_sleep_schedule TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_noise_tolerance TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_cleanliness_level TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_intro_extro TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_guests_frequency TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_study_environment TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferred_housing_area TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS distance_preference TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS town_village TEXT;
-- Add AI Match Plan tier system to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS ai_match_plan TEXT DEFAULT 'basic' 
CHECK (ai_match_plan IN ('basic', 'advanced', 'vip'));

-- Add optional living habits fields for enhanced matching
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS habit_cleanliness INTEGER DEFAULT 3 CHECK (habit_cleanliness BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS habit_noise INTEGER DEFAULT 3 CHECK (habit_noise BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS habit_sleep TEXT DEFAULT 'night',
ADD COLUMN IF NOT EXISTS habit_social INTEGER DEFAULT 3 CHECK (habit_social BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS dealbreakers TEXT[] DEFAULT '{}';
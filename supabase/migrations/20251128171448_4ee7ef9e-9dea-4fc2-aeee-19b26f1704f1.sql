-- Add new columns for dual roommate context and personality matching
ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_roommate_current_place boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_roommate_new_dorm boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS enable_personality_matching boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_test_completed boolean DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS personality_data jsonb;

-- Migrate existing data: Map old need_roommate to appropriate new fields
UPDATE students SET 
  needs_roommate_current_place = need_roommate 
WHERE accommodation_status = 'have_dorm';

UPDATE students SET 
  needs_roommate_new_dorm = need_roommate 
WHERE accommodation_status = 'need_dorm';

-- Add helpful comment
COMMENT ON COLUMN students.needs_roommate_current_place IS 'Student has accommodation and needs roommate(s) for current place';
COMMENT ON COLUMN students.needs_roommate_new_dorm IS 'Student needs dorm and wants roommate(s) for that new dorm';
COMMENT ON COLUMN students.enable_personality_matching IS 'Whether to use personality test for roommate matching';
COMMENT ON COLUMN students.personality_data IS 'Big Five personality trait scores (0-100 scale): openness, conscientiousness, extraversion, agreeableness, neuroticism';
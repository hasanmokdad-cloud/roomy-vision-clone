-- Add accommodation status and roommate fields to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS accommodation_status TEXT DEFAULT 'need_dorm' CHECK (accommodation_status IN ('need_dorm', 'have_dorm')),
ADD COLUMN IF NOT EXISTS need_roommate BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS roommates_needed INTEGER DEFAULT 0 CHECK (roommates_needed >= 0 AND roommates_needed <= 10);
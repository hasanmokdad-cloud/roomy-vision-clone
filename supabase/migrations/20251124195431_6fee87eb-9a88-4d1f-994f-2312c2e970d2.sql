-- Add new columns to students table for enhanced profile
ALTER TABLE students
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS year_of_study INTEGER,
ADD COLUMN IF NOT EXISTS governorate TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS town_village TEXT,
ADD COLUMN IF NOT EXISTS preferred_housing_area TEXT;
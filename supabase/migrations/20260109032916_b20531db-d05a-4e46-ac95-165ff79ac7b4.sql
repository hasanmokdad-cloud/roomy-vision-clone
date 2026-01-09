-- Add nearby_universities column to dorms table
ALTER TABLE dorms ADD COLUMN IF NOT EXISTS nearby_universities text[] DEFAULT '{}';
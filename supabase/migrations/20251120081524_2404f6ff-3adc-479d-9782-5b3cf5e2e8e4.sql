-- Add 'student' to the app_role enum
-- This will be committed and then we can update data in a subsequent statement
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
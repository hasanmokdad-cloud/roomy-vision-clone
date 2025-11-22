-- Add profile_photo_url column to owners table
ALTER TABLE public.owners 
ADD COLUMN profile_photo_url TEXT;
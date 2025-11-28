-- Add meeting platform support to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS meeting_platform text,
ADD CONSTRAINT valid_meeting_platform CHECK (meeting_platform IN ('google_meet', 'zoom', 'teams') OR meeting_platform IS NULL);
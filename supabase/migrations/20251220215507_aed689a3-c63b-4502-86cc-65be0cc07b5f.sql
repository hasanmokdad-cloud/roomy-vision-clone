-- Add played_at column to messages table for tracking voice message playback
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS played_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
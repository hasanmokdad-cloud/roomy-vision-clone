-- Create notification_preferences table for granular notification controls
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_tours BOOLEAN NOT NULL DEFAULT true,
  notify_messages BOOLEAN NOT NULL DEFAULT true,
  notify_reservations BOOLEAN NOT NULL DEFAULT true,
  notify_social BOOLEAN NOT NULL DEFAULT true,
  notify_promotions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for fast user lookup
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
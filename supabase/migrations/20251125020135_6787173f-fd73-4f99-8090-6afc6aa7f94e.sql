-- Update analytics_events type constraint to allow all event types
ALTER TABLE public.analytics_events 
DROP CONSTRAINT IF EXISTS analytics_events_type_check;

ALTER TABLE public.analytics_events
ADD CONSTRAINT analytics_events_type_check
CHECK (type IN (
  'view', 
  'favorite', 
  'inquiry', 
  'chat',
  'page_view', 
  'dorm_view', 
  'favorite_add', 
  'favorite_remove',
  'booking_request', 
  'contact_click', 
  'ai_match_start', 
  'ai_chat_start', 
  'onboarding_complete'
));
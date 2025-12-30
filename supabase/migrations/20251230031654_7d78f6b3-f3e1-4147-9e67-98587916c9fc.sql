-- Set REPLICA IDENTITY FULL on messages table to ensure UPDATE events include all row data for real-time subscriptions
ALTER TABLE public.messages REPLICA IDENTITY FULL;
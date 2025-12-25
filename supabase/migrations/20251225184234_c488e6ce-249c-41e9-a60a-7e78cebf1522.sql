-- Create admin_notifications table for in-app notifications to admins
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'payment',
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view their own notifications
CREATE POLICY "Admins view own notifications"
ON public.admin_notifications
FOR SELECT
USING (admin_id IN (
  SELECT id FROM public.admins WHERE user_id = auth.uid()
));

-- Admins can update their own notifications (mark as read)
CREATE POLICY "Admins update own notifications"
ON public.admin_notifications
FOR UPDATE
USING (admin_id IN (
  SELECT id FROM public.admins WHERE user_id = auth.uid()
));

-- System can insert notifications
CREATE POLICY "System can insert admin notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Add index for faster queries
CREATE INDEX idx_admin_notifications_admin_read ON public.admin_notifications(admin_id, read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
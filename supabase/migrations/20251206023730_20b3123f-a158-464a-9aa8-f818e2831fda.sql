-- =============================================
-- SECURITY HARDENING: Fix chat_context vulnerability
-- =============================================

-- Drop the dangerous overly permissive policy that bypasses RLS
DROP POLICY IF EXISTS "System can manage all contexts" ON public.chat_context;

-- =============================================
-- SECURITY MONITORING: Create security_events table
-- =============================================

CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_region TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view all security events"
ON public.security_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- System can insert security events (edge functions use service_role)
CREATE POLICY "System can insert security events"
ON public.security_events FOR INSERT
WITH CHECK (true);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON public.security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id, created_at DESC);

-- Enable realtime for live monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
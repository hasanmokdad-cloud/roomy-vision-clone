-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('view', 'favorite', 'inquiry', 'chat')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE CASCADE,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_dorm_id ON public.analytics_events(dorm_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Create owner_notifications table
CREATE TABLE IF NOT EXISTS public.owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.owners(id) ON DELETE CASCADE,
  dorm_id UUID REFERENCES public.dorms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_notifications_owner_id ON public.owner_notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_notifications_read ON public.owner_notifications(read);

-- Create dorm_engagement_view (materialized for performance)
CREATE OR REPLACE VIEW public.dorm_engagement_view AS
SELECT 
  dorm_id,
  COUNT(*) FILTER (WHERE type = 'view') AS views,
  COUNT(*) FILTER (WHERE type = 'favorite') AS favorites,
  COUNT(*) FILTER (WHERE type = 'inquiry') AS inquiries
FROM public.analytics_events
WHERE created_at > now() - INTERVAL '30 days'
  AND dorm_id IS NOT NULL
GROUP BY dorm_id;

-- Create owner_performance_view
CREATE OR REPLACE VIEW public.owner_performance_view AS
SELECT 
  d.owner_id,
  d.id AS dorm_id,
  d.dorm_name,
  COALESCE(e.views, 0) AS views,
  COALESCE(e.favorites, 0) AS favorites,
  COALESCE(e.inquiries, 0) AS inquiries
FROM public.dorms d
LEFT JOIN public.dorm_engagement_view e ON d.id = e.dorm_id
WHERE d.owner_id IS NOT NULL;

-- Create analytics_summary RPC function
CREATE OR REPLACE FUNCTION public.analytics_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalViews', COUNT(*) FILTER (WHERE type = 'view'),
    'totalFavorites', COUNT(*) FILTER (WHERE type = 'favorite'),
    'totalInquiries', COUNT(*) FILTER (WHERE type = 'inquiry'),
    'uniqueUsers', COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
  )
  INTO result
  FROM public.analytics_events
  WHERE created_at > now() - INTERVAL '30 days';
  
  RETURN result;
END;
$$;

-- Create analytics_timeseries RPC function
CREATE OR REPLACE FUNCTION public.analytics_timeseries(p_metric TEXT, p_days INT DEFAULT 30)
RETURNS TABLE(date TEXT, value BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date,
    COUNT(*) AS value
  FROM public.analytics_events
  WHERE type = p_metric
    AND created_at > now() - (p_days || ' days')::INTERVAL
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY DATE_TRUNC('day', created_at);
END;
$$;

-- Create recompute_dorm_engagement_scores placeholder RPC
CREATE OR REPLACE FUNCTION public.recompute_dorm_engagement_scores()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder: in production, this would update a scores table
  RETURN json_build_object('success', true);
END;
$$;

-- Enable RLS on analytics tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_events (admins only)
CREATE POLICY "Admins can view all analytics_events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert analytics_events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS policies for owner_notifications
CREATE POLICY "Owners can view their own notifications"
ON public.owner_notifications
FOR SELECT
TO authenticated
USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

CREATE POLICY "System can insert owner_notifications"
ON public.owner_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Owners can update their own notifications"
ON public.owner_notifications
FOR UPDATE
TO authenticated
USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- ============================================
-- FIX 1: Recreate Views with SECURITY INVOKER
-- ============================================

-- Drop all existing views
DROP VIEW IF EXISTS public.user_growth_daily CASCADE;
DROP VIEW IF EXISTS public.user_activity_summary CASCADE;
DROP VIEW IF EXISTS public.owner_performance_view CASCADE;
DROP VIEW IF EXISTS public.engagement_metrics_daily CASCADE;
DROP VIEW IF EXISTS public.dorm_performance_summary CASCADE;
DROP VIEW IF EXISTS public.dorm_engagement_view CASCADE;

-- Recreate with SECURITY INVOKER (executes with querying user's permissions)
CREATE VIEW public.dorm_engagement_view
WITH (security_invoker = true) AS
SELECT 
  dorm_id,
  COUNT(*) FILTER (WHERE type = 'view') AS views,
  COUNT(*) FILTER (WHERE type = 'favorite') AS favorites,
  COUNT(*) FILTER (WHERE type = 'inquiry') AS inquiries
FROM analytics_events
WHERE created_at > now() - INTERVAL '30 days'
  AND dorm_id IS NOT NULL
GROUP BY dorm_id;

CREATE VIEW public.dorm_performance_summary
WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.name,
  d.area,
  d.monthly_price,
  COALESCE(e.views, 0) AS views,
  COALESCE(e.favorites, 0) AS favorites,
  COALESCE(e.inquiries, 0) AS inquiries,
  CASE 
    WHEN COALESCE(e.views, 0) > 0 
    THEN ROUND((COALESCE(e.inquiries, 0)::numeric / e.views::numeric) * 100, 2)
    ELSE 0
  END AS conversion_rate
FROM dorms d
LEFT JOIN dorm_engagement_view e ON d.id = e.dorm_id
WHERE d.verification_status = 'Verified'
ORDER BY COALESCE(e.views, 0) DESC;

CREATE VIEW public.engagement_metrics_daily
WITH (security_invoker = true) AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) FILTER (WHERE type = 'view') AS views,
  COUNT(*) FILTER (WHERE type = 'favorite') AS favorites,
  COUNT(*) FILTER (WHERE type = 'inquiry') AS inquiries,
  COUNT(DISTINCT user_id) AS active_users
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

CREATE VIEW public.owner_performance_view
WITH (security_invoker = true) AS
SELECT 
  d.owner_id,
  d.id AS dorm_id,
  d.name AS dorm_name,
  COALESCE(e.views, 0) AS views,
  COALESCE(e.favorites, 0) AS favorites,
  COALESCE(e.inquiries, 0) AS inquiries
FROM dorms d
LEFT JOIN dorm_engagement_view e ON d.id = e.dorm_id
WHERE d.owner_id IS NOT NULL;

CREATE VIEW public.user_activity_summary
WITH (security_invoker = true) AS
SELECT 
  s.user_id,
  s.full_name,
  s.email,
  COUNT(DISTINCT ae.id) AS total_interactions,
  COUNT(DISTINCT CASE WHEN ae.type = 'view' THEN ae.id ELSE NULL END) AS views,
  COUNT(DISTINCT CASE WHEN ae.type = 'favorite' THEN ae.id ELSE NULL END) AS favorites,
  COUNT(DISTINCT tb.id) AS tours_booked,
  s.profile_completion_score,
  s.last_login
FROM students s
LEFT JOIN analytics_events ae ON ae.user_id = s.user_id
LEFT JOIN tour_bookings tb ON tb.student_id = s.id
GROUP BY s.user_id, s.full_name, s.email, s.profile_completion_score, s.last_login;

CREATE VIEW public.user_growth_daily
WITH (security_invoker = true) AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) FILTER (WHERE created_at IS NOT NULL AND role = 'student') AS new_students,
  COUNT(*) FILTER (WHERE created_at IS NOT NULL AND role = 'owner') AS new_owners
FROM (
  SELECT created_at, 'student' AS role FROM students
  UNION ALL
  SELECT created_at, 'owner' AS role FROM owners
) combined
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- ============================================
-- FIX 2: Add Search Path to Security Definer Functions
-- ============================================

CREATE OR REPLACE FUNCTION public.analytics_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.analytics_timeseries(p_metric TEXT, p_days INTEGER DEFAULT 30)
RETURNS TABLE(date TEXT, value BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.recompute_dorm_engagement_scores()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Placeholder: in production, this would update a scores table
  RETURN json_build_object('success', true);
END;
$$;
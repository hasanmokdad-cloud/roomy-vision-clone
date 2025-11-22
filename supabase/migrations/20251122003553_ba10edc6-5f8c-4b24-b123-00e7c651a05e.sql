-- Add analytics columns to users tables
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_completion_score integer DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

ALTER TABLE owners ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE owners ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create user growth daily view
CREATE OR REPLACE VIEW user_growth_daily AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE 'student' = 'student') as new_students,
  COUNT(*) FILTER (WHERE 'owner' = 'owner') as new_owners
FROM (
  SELECT created_at, 'student' as role FROM students
  UNION ALL
  SELECT created_at, 'owner' as role FROM owners
) combined
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create engagement metrics view
CREATE OR REPLACE VIEW engagement_metrics_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE type = 'view') as views,
  COUNT(*) FILTER (WHERE type = 'favorite') as favorites,
  COUNT(*) FILTER (WHERE type = 'inquiry') as inquiries,
  COUNT(DISTINCT user_id) as active_users
FROM analytics_events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create dorm performance summary view
CREATE OR REPLACE VIEW dorm_performance_summary AS
SELECT 
  d.id,
  d.dorm_name as name,
  d.area,
  d.monthly_price,
  COALESCE(e.views, 0) as views,
  COALESCE(e.favorites, 0) as favorites,
  COALESCE(e.inquiries, 0) as inquiries,
  CASE 
    WHEN COALESCE(e.views, 0) > 0 
    THEN ROUND((COALESCE(e.inquiries, 0)::numeric / e.views::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate
FROM dorms d
LEFT JOIN dorm_engagement_view e ON d.id = e.dorm_id
WHERE d.verification_status = 'Verified'
ORDER BY views DESC;

-- Create user activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  s.user_id,
  s.full_name,
  s.email,
  COUNT(DISTINCT ae.id) as total_interactions,
  COUNT(DISTINCT CASE WHEN ae.type = 'view' THEN ae.id END) as views,
  COUNT(DISTINCT CASE WHEN ae.type = 'favorite' THEN ae.id END) as favorites,
  COUNT(DISTINCT tb.id) as tours_booked,
  s.profile_completion_score,
  s.last_login
FROM students s
LEFT JOIN analytics_events ae ON ae.user_id = s.user_id
LEFT JOIN tour_bookings tb ON tb.student_id = s.id
GROUP BY s.user_id, s.full_name, s.email, s.profile_completion_score, s.last_login;
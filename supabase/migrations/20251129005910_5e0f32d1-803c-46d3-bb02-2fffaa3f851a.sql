-- Create AI Match Logs table
CREATE TABLE ai_match_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('dorm', 'roommate', 'combined')),
  match_tier TEXT NOT NULL CHECK (match_tier IN ('basic', 'advanced', 'vip')),
  personality_used BOOLEAN DEFAULT FALSE,
  result_count INTEGER DEFAULT 0,
  insights_generated BOOLEAN DEFAULT FALSE,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_match_logs ENABLE ROW LEVEL SECURITY;

-- Students can view their own logs
CREATE POLICY "Students can view own logs" ON ai_match_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.user_id = auth.uid() 
      AND students.id = ai_match_logs.student_id
    )
  );

-- System can insert logs
CREATE POLICY "System can insert logs" ON ai_match_logs
  FOR INSERT WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON ai_match_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );
-- Add RLS policy to allow authenticated users to read owner user_id for messaging
CREATE POLICY "Authenticated users can view owner user_id for messaging" 
ON owners FOR SELECT 
TO authenticated 
USING (true);
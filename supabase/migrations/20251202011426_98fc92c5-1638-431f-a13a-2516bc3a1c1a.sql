-- Create user_payment_profiles table for storing Whish payment info
CREATE TABLE user_payment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_payment_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own payment profile
CREATE POLICY "Users read/write own payment profile" 
  ON user_payment_profiles FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
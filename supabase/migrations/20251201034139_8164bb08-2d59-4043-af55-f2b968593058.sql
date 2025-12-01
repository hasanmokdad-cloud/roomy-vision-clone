-- Add username column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_username_lower ON students (LOWER(username));

-- Create friendship status enum
DO $$ BEGIN
  CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending',
  acted_by UUID REFERENCES students(id),
  blocker_id UUID REFERENCES students(id),
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_friendship_pair UNIQUE (requester_id, receiver_id),
  CONSTRAINT no_self_friendship CHECK (requester_id != receiver_id)
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Function to prevent duplicate friendships regardless of order
CREATE OR REPLACE FUNCTION check_friendship_symmetry()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM friendships 
    WHERE requester_id = NEW.receiver_id 
    AND receiver_id = NEW.requester_id
  ) THEN
    RAISE EXCEPTION 'Friendship already exists between these users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_friendship_symmetry ON friendships;
CREATE TRIGGER enforce_friendship_symmetry
  BEFORE INSERT ON friendships
  FOR EACH ROW EXECUTE FUNCTION check_friendship_symmetry();

-- Helper function: Get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(user_a UUID, user_b UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM (
    SELECT CASE 
      WHEN requester_id = user_a THEN receiver_id 
      ELSE requester_id 
    END as friend_id
    FROM friendships
    WHERE (requester_id = user_a OR receiver_id = user_a)
    AND status = 'accepted'
  ) AS friends_a
  INNER JOIN (
    SELECT CASE 
      WHEN requester_id = user_b THEN receiver_id 
      ELSE requester_id 
    END as friend_id
    FROM friendships
    WHERE (requester_id = user_b OR receiver_id = user_b)
    AND status = 'accepted'
  ) AS friends_b
  ON friends_a.friend_id = friends_b.friend_id;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Helper function: Check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE ((requester_id = user_a AND receiver_id = user_b)
       OR (requester_id = user_b AND receiver_id = user_a))
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Helper function: Check if blocked
CREATE OR REPLACE FUNCTION is_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE ((requester_id = user_a AND receiver_id = user_b)
       OR (requester_id = user_b AND receiver_id = user_a))
    AND status = 'blocked'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RLS Policies for friendships
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships"
ON friendships FOR SELECT
USING (
  requester_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create friend requests" ON friendships;
CREATE POLICY "Users can create friend requests"
ON friendships FOR INSERT
WITH CHECK (
  requester_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
CREATE POLICY "Users can update own friendships"
ON friendships FOR UPDATE
USING (
  requester_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships"
ON friendships FOR DELETE
USING (
  requester_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  OR receiver_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update dorms table with all required columns
ALTER TABLE public.dorms 
  ADD COLUMN IF NOT EXISTS dorm_name TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS room_types TEXT,
  ADD COLUMN IF NOT EXISTS monthly_price NUMERIC,
  ADD COLUMN IF NOT EXISTS shuttle BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS services_amenities TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Pending' CHECK (verification_status IN ('Verified', 'Pending', 'Unverified'));

-- Migrate existing data to new columns
UPDATE public.dorms 
SET dorm_name = name 
WHERE dorm_name IS NULL;

UPDATE public.dorms 
SET monthly_price = price 
WHERE monthly_price IS NULL;

-- Update RLS policies for dorms
DROP POLICY IF EXISTS "Dorms are viewable by everyone" ON public.dorms;
DROP POLICY IF EXISTS "Authenticated users can insert dorms" ON public.dorms;

CREATE POLICY "Everyone can view verified dorms"
  ON public.dorms
  FOR SELECT
  USING (verification_status = 'Verified' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert dorms"
  ON public.dorms
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update dorms"
  ON public.dorms
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete dorms"
  ON public.dorms
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 16 AND age <= 100),
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  email TEXT NOT NULL,
  university TEXT,
  residential_area TEXT,
  preferred_university TEXT,
  room_type TEXT,
  roommate_needed BOOLEAN DEFAULT false,
  budget NUMERIC CHECK (budget >= 0),
  distance_preference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS policies for students
CREATE POLICY "Users can view their own profile"
  ON public.students
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.students
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.students
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.students
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for students updated_at
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create student profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.students (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to create student profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dorms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_recommendations_log;
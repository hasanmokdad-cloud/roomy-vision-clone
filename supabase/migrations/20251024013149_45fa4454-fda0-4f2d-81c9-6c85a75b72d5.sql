-- Create owners table for dorm property owners
CREATE TABLE public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- RLS policies for owners
CREATE POLICY "Owners can view their own profile"
  ON public.owners
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can update their own profile"
  ON public.owners
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all owners"
  ON public.owners
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all owners"
  ON public.owners
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Add owner_id to dorms table
ALTER TABLE public.dorms
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL;

-- Update dorms RLS policies for owners
CREATE POLICY "Owners can view their own dorms"
  ON public.dorms
  FOR SELECT
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

CREATE POLICY "Owners can update their own dorms"
  ON public.dorms
  FOR UPDATE
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

CREATE POLICY "Owners can insert dorms for themselves"
  ON public.dorms
  FOR INSERT
  WITH CHECK (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

CREATE POLICY "Owners can delete their own dorms"
  ON public.dorms
  FOR DELETE
  USING (owner_id IN (SELECT id FROM public.owners WHERE user_id = auth.uid()));

-- System logs table for audit trail
CREATE TABLE public.system_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_affected TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view system logs
CREATE POLICY "Only admins can view system logs"
  ON public.system_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to auto-create owner profile
CREATE OR REPLACE FUNCTION public.handle_new_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has 'owner' role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = NEW.id AND role = 'owner'
  ) THEN
    INSERT INTO public.owners (user_id, full_name, email, phone_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone_number'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to handle owners too
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update handle_new_user function to handle both students and owners
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Determine role from email or metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role);
  
  -- Create appropriate profile
  IF user_role = 'owner' THEN
    INSERT INTO public.owners (user_id, full_name, email, phone_number)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone_number'
    );
  ELSE
    INSERT INTO public.students (user_id, full_name, email)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for owners updated_at
CREATE TRIGGER update_owners_updated_at
  BEFORE UPDATE ON public.owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.owners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
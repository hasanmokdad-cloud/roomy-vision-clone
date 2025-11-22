-- Create admins table with similar structure to owners/students
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text,
  profile_photo_url text,
  phone_verified boolean DEFAULT false,
  last_login timestamp with time zone,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX idx_admins_user_id ON public.admins(user_id);
CREATE INDEX idx_admins_email ON public.admins(email);

-- RLS Policies for admins table
CREATE POLICY "Admins can view own profile"
ON public.admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update own profile"
ON public.admins
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin profiles"
ON public.admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing admin data from owners table to admins table
DO $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Get all admin user IDs and their data from owners table
  FOR admin_record IN 
    SELECT DISTINCT o.user_id, o.full_name, o.email, o.phone_number, 
           o.profile_photo_url, o.phone_verified, o.status
    FROM owners o
    JOIN user_roles ur ON o.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'admin'
  LOOP
    -- Insert into admins table
    INSERT INTO public.admins (user_id, full_name, email, phone_number, profile_photo_url, phone_verified, status)
    VALUES (
      admin_record.user_id,
      admin_record.full_name,
      admin_record.email,
      admin_record.phone_number,
      admin_record.profile_photo_url,
      admin_record.phone_verified,
      admin_record.status
    )
    ON CONFLICT (user_id) DO UPDATE SET
      profile_photo_url = EXCLUDED.profile_photo_url,
      phone_number = EXCLUDED.phone_number,
      phone_verified = EXCLUDED.phone_verified,
      updated_at = now();
    
    -- Delete from owners table (admins should NOT be in owners)
    DELETE FROM owners WHERE user_id = admin_record.user_id;
  END LOOP;
END $$;
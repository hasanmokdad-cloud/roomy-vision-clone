-- Create admin profile for hassan.mokdad01@lau.edu
-- This ensures the admin user has a profile in the admins table
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'hassan.mokdad01@lau.edu';
BEGIN
  -- Get the user_id for the admin
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  -- Insert admin record if user exists and no admin record exists
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admins (user_id, full_name, email, status)
    VALUES (
      admin_user_id,
      'Hassan Mokdad',
      admin_email,
      'active'
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
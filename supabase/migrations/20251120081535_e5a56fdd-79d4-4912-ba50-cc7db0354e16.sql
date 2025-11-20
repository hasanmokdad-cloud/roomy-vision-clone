-- Update all existing 'user' roles to 'student'
-- Now that 'student' enum value is committed, we can use it
UPDATE public.user_roles 
SET role = 'student'
WHERE role = 'user';
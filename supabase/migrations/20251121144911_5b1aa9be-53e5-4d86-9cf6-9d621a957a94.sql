-- Make role_id nullable in user_roles to allow Lovable auth signups
-- This allows new users to sign up without immediate role assignment

ALTER TABLE public.user_roles
  ALTER COLUMN role_id DROP NOT NULL;

-- Add a comment explaining the nullable role_id
COMMENT ON COLUMN public.user_roles.role_id IS 'Foreign key to roles table. Nullable to allow signup before role selection. Will be populated when user selects their role (student/owner/admin).';

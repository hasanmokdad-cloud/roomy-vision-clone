-- Create email verification tokens table for custom email system
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  token_type text NOT NULL DEFAULT 'signup', -- 'signup', 'recovery', 'email_change'
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON public.email_verification_tokens(email);

-- RLS Policies
CREATE POLICY "System can manage tokens"
ON public.email_verification_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM email_verification_tokens
  WHERE expires_at < now() OR used_at IS NOT NULL;
END;
$$;
-- Create user_devices table for device fingerprinting
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  fingerprint_hash TEXT NOT NULL,
  device_name TEXT NOT NULL,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  device_type TEXT,
  ip_region TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_current BOOLEAN DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fingerprint_hash)
);

-- Create device_security_logs table
CREATE TABLE public.device_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL,
  device_fingerprint TEXT,
  ip_region TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_devices
CREATE POLICY "Users can view own devices" ON public.user_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON public.user_devices
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage devices" ON public.user_devices
  FOR ALL USING (true) WITH CHECK (true);

-- Enable RLS on device_security_logs
ALTER TABLE public.device_security_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for device_security_logs
CREATE POLICY "Users can view own security logs" ON public.device_security_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert security logs" ON public.device_security_logs
  FOR INSERT WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_user_devices_user_fingerprint ON public.user_devices(user_id, fingerprint_hash);
CREATE INDEX idx_user_devices_token ON public.user_devices(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_device_security_logs_user ON public.device_security_logs(user_id, created_at DESC);
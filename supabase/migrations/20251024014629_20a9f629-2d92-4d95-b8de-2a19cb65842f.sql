-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to process pending notifications every 15 minutes
SELECT cron.schedule(
  'process-pending-notifications-every-15-min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vtdtmhgzisigtqryojwl.supabase.co/functions/v1/process-pending-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);
-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the publish-scheduled-posts function to run every 5 minutes
SELECT cron.schedule(
  'publish-scheduled-blog-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://yubebbfsmlopmnluajgf.supabase.co/functions/v1/publish-scheduled-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YmViYmZzbWxvcG1ubHVhamdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MjQxNDUsImV4cCI6MjA4NTIwMDE0NX0.625SioK5zQ0n5LtS7JCWarCaUdOw8-VltlHQRhZfs1o"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
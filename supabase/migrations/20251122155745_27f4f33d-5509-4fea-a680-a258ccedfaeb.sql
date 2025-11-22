-- Make dorm-uploads bucket public so gallery images load
UPDATE storage.buckets 
SET public = true 
WHERE name = 'dorm-uploads';
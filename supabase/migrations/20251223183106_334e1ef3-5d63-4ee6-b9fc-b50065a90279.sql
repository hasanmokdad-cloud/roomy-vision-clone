-- Add audio MIME types to message-media storage bucket for voice messages
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mp4', 'audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/x-m4a'
]::text[]
WHERE name = 'message-media';
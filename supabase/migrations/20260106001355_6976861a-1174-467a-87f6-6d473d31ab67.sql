-- Update room-images bucket to allow all common image and video MIME types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Images
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
  'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif',
  'image/avif', 'image/apng', 'image/x-icon', 'image/vnd.microsoft.icon',
  -- Videos
  'video/mp4', 'video/mpeg', 'video/webm', 'video/ogg', 'video/quicktime',
  'video/x-msvideo', 'video/x-ms-wmv', 'video/avi', 'video/x-matroska',
  'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/x-flv'
]
WHERE id = 'room-images';
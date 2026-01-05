-- Allow authenticated users to upload to wizard-rooms folder during wizard flow
CREATE POLICY "Authenticated users can upload wizard room images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-images' 
  AND (storage.foldername(name))[1] = 'wizard-rooms'
);

-- Allow authenticated users to read their wizard uploads
CREATE POLICY "Authenticated users can view wizard room images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'room-images' 
  AND (storage.foldername(name))[1] = 'wizard-rooms'
);

-- Allow authenticated users to delete their wizard uploads
CREATE POLICY "Authenticated users can delete wizard room images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' 
  AND (storage.foldername(name))[1] = 'wizard-rooms'
);
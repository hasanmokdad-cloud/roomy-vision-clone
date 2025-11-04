-- Create storage bucket for dorm uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('dorm-uploads', 'dorm-uploads', false);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload dorm files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dorm-uploads');

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can read dorm files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'dorm-uploads');
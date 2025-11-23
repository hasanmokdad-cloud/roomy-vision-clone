-- Fix room creation permissions and storage policies

-- Drop all existing room policies
DROP POLICY IF EXISTS "Owners can manage their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can manage all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can insert rooms for their dorms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can view their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can update their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Owners can delete their dorm rooms" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view available rooms" ON public.rooms;

-- Allow owners to insert rooms for their own dorms
CREATE POLICY "Owners can insert rooms for their dorms"
ON public.rooms
FOR INSERT
TO authenticated
WITH CHECK (
  dorm_id IN (
    SELECT d.id 
    FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Allow owners to select their dorm rooms
CREATE POLICY "Owners can view their dorm rooms"
ON public.rooms
FOR SELECT
TO authenticated
USING (
  dorm_id IN (
    SELECT d.id
    FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Allow owners to update their dorm rooms
CREATE POLICY "Owners can update their dorm rooms"
ON public.rooms
FOR UPDATE
TO authenticated
USING (
  dorm_id IN (
    SELECT d.id
    FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
)
WITH CHECK (
  dorm_id IN (
    SELECT d.id
    FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Allow owners to delete their dorm rooms
CREATE POLICY "Owners can delete their dorm rooms"
ON public.rooms
FOR DELETE
TO authenticated
USING (
  dorm_id IN (
    SELECT d.id
    FROM dorms d
    JOIN owners o ON d.owner_id = o.id
    WHERE o.user_id = auth.uid()
  )
);

-- Allow admins to manage all rooms
CREATE POLICY "Admins can manage all rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);

-- Drop existing storage policies for room-images if they exist
DROP POLICY IF EXISTS "Owners can upload room images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view room images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete room images" ON storage.objects;

-- Allow authenticated owners to upload room images
CREATE POLICY "Owners can upload room images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'room-images' AND
  auth.uid() IN (SELECT user_id FROM owners)
);

-- Allow anyone to view room images (public bucket)
CREATE POLICY "Anyone can view room images"
ON storage.objects
FOR SELECT
TO authenticated, anon
USING (bucket_id = 'room-images');

-- Allow owners to delete room images
CREATE POLICY "Owners can delete room images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'room-images' AND
  auth.uid() IN (SELECT user_id FROM owners)
);
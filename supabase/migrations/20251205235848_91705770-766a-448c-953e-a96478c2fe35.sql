-- Add RLS policies for rooms table to allow owners to manage their rooms

-- Policy 1: Public can view rooms
CREATE POLICY "Public can view rooms" ON public.rooms 
FOR SELECT USING (true);

-- Policy 2: Owners can insert rooms for their dorms
CREATE POLICY "Owners can insert rooms for own dorms" ON public.rooms 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.dorms d 
    JOIN public.owners o ON d.owner_id = o.id 
    WHERE d.id = dorm_id AND o.user_id = auth.uid()
  )
);

-- Policy 3: Owners can update rooms in their dorms  
CREATE POLICY "Owners can update rooms in own dorms" ON public.rooms 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.dorms d 
    JOIN public.owners o ON d.owner_id = o.id 
    WHERE d.id = dorm_id AND o.user_id = auth.uid()
  )
);

-- Policy 4: Owners can delete rooms from their dorms
CREATE POLICY "Owners can delete rooms from own dorms" ON public.rooms 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.dorms d 
    JOIN public.owners o ON d.owner_id = o.id 
    WHERE d.id = dorm_id AND o.user_id = auth.uid()
  )
);

-- Policy 5: Admins can manage all rooms
CREATE POLICY "Admins can manage all rooms" ON public.rooms
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
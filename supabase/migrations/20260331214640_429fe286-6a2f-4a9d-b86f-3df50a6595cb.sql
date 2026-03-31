
CREATE TABLE IF NOT EXISTS public.room_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  space_type   text NOT NULL,
  sort_order   int DEFAULT 0,
  url          text NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view room images" ON public.room_images FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert room images" ON public.room_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update room images" ON public.room_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete room images" ON public.room_images FOR DELETE TO authenticated USING (true);

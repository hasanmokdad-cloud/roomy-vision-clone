-- Create dorms table if not exists
CREATE TABLE IF NOT EXISTS public.dorms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL NOT NULL,
  capacity INTEGER,
  type TEXT,
  amenities TEXT[],
  description TEXT,
  image_url TEXT,
  university TEXT,
  gender_preference TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_sessions table
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_recommendations_log table
CREATE TABLE IF NOT EXISTS public.ai_recommendations_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dorm_id UUID REFERENCES public.dorms(id),
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dorms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations_log ENABLE ROW LEVEL SECURITY;

-- Dorms policies (public read, admin write)
CREATE POLICY "Dorms are viewable by everyone" 
ON public.dorms 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert dorms" 
ON public.dorms 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- AI sessions policies (users can only see their own)
CREATE POLICY "Users can view their own AI sessions" 
ON public.ai_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI sessions" 
ON public.ai_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- AI recommendations log policies
CREATE POLICY "Users can view their own recommendations log" 
ON public.ai_recommendations_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recommendations log" 
ON public.ai_recommendations_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on dorms
CREATE TRIGGER update_dorms_updated_at
BEFORE UPDATE ON public.dorms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
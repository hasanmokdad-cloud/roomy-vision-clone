-- Create help_article_feedback table for tracking user feedback
CREATE TABLE public.help_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  session_id TEXT
);

-- Enable RLS
ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback
CREATE POLICY "Anyone can submit feedback" ON public.help_article_feedback
  FOR INSERT WITH CHECK (true);

-- Users can see their own feedback
CREATE POLICY "Users can view own feedback" ON public.help_article_feedback
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create help_articles table for full-text search
CREATE TABLE public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create GIN index for fast full-text search
CREATE INDEX help_articles_search_idx ON public.help_articles USING GIN (search_vector);

-- Enable RLS with public read access
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read help articles" ON public.help_articles
  FOR SELECT USING (true);

-- Create function for full-text search
CREATE OR REPLACE FUNCTION public.search_help_articles(search_query TEXT)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  content TEXT,
  category TEXT,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF length(trim(search_query)) < 2 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    ha.id,
    ha.slug,
    ha.title,
    ha.content,
    ha.category,
    ts_rank(ha.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.help_articles ha
  WHERE ha.search_vector @@ plainto_tsquery('english', search_query)
     OR ha.title ILIKE '%' || search_query || '%'
     OR ha.content ILIKE '%' || search_query || '%'
  ORDER BY rank DESC, ha.title
  LIMIT 20;
END;
$$;
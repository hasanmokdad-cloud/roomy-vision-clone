-- Create shared_collections table
CREATE TABLE shared_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code VARCHAR(12) UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  CONSTRAINT valid_title_length CHECK (char_length(title) <= 100),
  CONSTRAINT valid_description_length CHECK (char_length(description) <= 500)
);

-- Index for fast lookups
CREATE UNIQUE INDEX idx_share_code ON shared_collections(share_code);
CREATE INDEX idx_student_collections ON shared_collections(student_id);

-- Enable RLS
ALTER TABLE shared_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view own collections"
  ON shared_collections FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create collections"
  ON shared_collections FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own collections"
  ON shared_collections FOR UPDATE
  USING (auth.uid() = student_id);

CREATE POLICY "Students can delete own collections"
  ON shared_collections FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Anyone can view public collections"
  ON shared_collections FOR SELECT
  USING (is_public = true);

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share_code
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL OR NEW.share_code = '' THEN
    LOOP
      NEW.share_code := generate_share_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM shared_collections WHERE share_code = NEW.share_code);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_share_code
  BEFORE INSERT ON shared_collections
  FOR EACH ROW
  EXECUTE FUNCTION set_share_code();

-- Update timestamp trigger
CREATE TRIGGER update_shared_collections_updated_at
  BEFORE UPDATE ON shared_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_collection_views(p_share_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_collections
  SET view_count = view_count + 1
  WHERE share_code = p_share_code AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
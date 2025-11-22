-- Create saved_rooms table for room favorites
CREATE TABLE IF NOT EXISTS saved_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  room_id UUID NOT NULL,
  dorm_id UUID NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, room_id)
);

-- Enable RLS
ALTER TABLE saved_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their saved rooms"
  ON saved_rooms FOR ALL
  USING (auth.uid() = student_id);

-- Indexes for performance
CREATE INDEX idx_saved_rooms_student ON saved_rooms(student_id);
CREATE INDEX idx_saved_rooms_room ON saved_rooms(room_id);
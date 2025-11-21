-- Phase 5: Reviews and Rating System

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dorm_id UUID REFERENCES dorms(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT,
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  amenities_rating INTEGER CHECK (amenities_rating >= 1 AND amenities_rating <= 5),
  verified_stay BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review responses (for owners to reply)
CREATE TABLE review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review helpful votes
CREATE TABLE review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Review images
CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reviews_dorm ON reviews(dorm_id);
CREATE INDEX idx_reviews_room ON reviews(room_id);
CREATE INDEX idx_reviews_student ON reviews(student_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_review_responses_review ON review_responses(review_id);
CREATE INDEX idx_review_helpful_review ON review_helpful_votes(review_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Students can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Students can view own reviews" ON reviews
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can update own pending reviews" ON reviews
  FOR UPDATE USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Owners can view their dorm reviews" ON reviews
  FOR SELECT USING (
    dorm_id IN (
      SELECT d.id FROM dorms d
      JOIN owners o ON d.owner_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- RLS Policies for review_responses
CREATE POLICY "Owners can create responses" ON review_responses
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view responses" ON review_responses
  FOR SELECT USING (true);

-- RLS Policies for review_helpful_votes
CREATE POLICY "Users can vote helpful" ON review_helpful_votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view helpful votes" ON review_helpful_votes
  FOR SELECT USING (true);

-- RLS Policies for review_images
CREATE POLICY "Students can add review images" ON review_images
  FOR INSERT WITH CHECK (
    review_id IN (
      SELECT r.id FROM reviews r
      JOIN students s ON r.student_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view review images" ON review_images
  FOR SELECT USING (true);

-- Enable realtime for reviews (Phase 6)
ALTER PUBLICATION supabase_realtime ADD TABLE reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE review_responses;
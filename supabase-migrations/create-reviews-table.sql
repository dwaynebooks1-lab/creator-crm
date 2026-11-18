-- Reviews / testimonials from real users
CREATE TABLE IF NOT EXISTS reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid REFERENCES creators(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL,
  name text,
  role text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can insert their own review
CREATE POLICY "Users can insert own review" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can read their own review
CREATE POLICY "Users can read own review" ON reviews
  FOR SELECT USING (auth.uid() = creator_id);

-- Service role has full access (for admin/landing page)
CREATE POLICY "Service role full access" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

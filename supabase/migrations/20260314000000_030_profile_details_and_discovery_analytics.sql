/*
  # Profile Details and Discovery Mode Analytics

  ## Overview
  Creates tables for storing detailed profile information (bio, interests, preferences),
  profile photos with ordering, and analytics events for discovery mode tracking.

  ## Tables
  - profile_details: Extended profile information for discovery mode
  - profile_photos: User photo gallery with display ordering
  - discovery_mode_analytics: Event tracking for discovery mode behavior

  ## Security
  - RLS enabled with appropriate policies
  - Users can view any profile details (for discovery)
  - Users can only manage their own profile details and photos
  - Analytics events are write-only for authenticated users

  ## Requirements
  Implements requirements 5.1, 6.1, 7.1, 25.1-25.8 from scroll-based-discovery-mode spec
*/

-- Profile Details Table
CREATE TABLE IF NOT EXISTS profile_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio TEXT,
  interests TEXT[],
  gender_preference TEXT,
  occupation TEXT,
  education TEXT,
  pets TEXT,
  hobbies TEXT[],
  drinking_preference TEXT,
  smoking_preference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profile_details ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_details
CREATE POLICY "Anyone can view profile details"
  ON profile_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile details"
  ON profile_details FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile details"
  ON profile_details FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile details"
  ON profile_details FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_profile_details_user_id ON profile_details(user_id);

-- Profile Photos Table
CREATE TABLE IF NOT EXISTS profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_photos
CREATE POLICY "Anyone can view profile photos"
  ON profile_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile photos"
  ON profile_photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile photos"
  ON profile_photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile photos"
  ON profile_photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for user_id lookups and display_order sorting
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON profile_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_photos_display_order ON profile_photos(user_id, display_order);

-- Discovery Mode Analytics Table
CREATE TABLE IF NOT EXISTS discovery_mode_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discovery_mode_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discovery_mode_analytics
-- Users can only insert their own analytics events
CREATE POLICY "Users can insert own analytics events"
  ON discovery_mode_analytics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only service role can read analytics (for reporting/analysis)
CREATE POLICY "Service role can view all analytics"
  ON discovery_mode_analytics FOR SELECT
  TO service_role
  USING (true);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_discovery_mode_analytics_user_id ON discovery_mode_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_mode_analytics_event_type ON discovery_mode_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_discovery_mode_analytics_created_at ON discovery_mode_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_discovery_mode_analytics_profile_id ON discovery_mode_analytics(profile_id);

-- Trigger to update updated_at timestamp on profile_details
CREATE TRIGGER update_profile_details_updated_at 
  BEFORE UPDATE ON profile_details
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Comments for documentation
COMMENT ON TABLE profile_details IS 'Extended profile information for discovery mode including bio, interests, and preferences';
COMMENT ON TABLE profile_photos IS 'User photo gallery with display ordering for profile archive section';
COMMENT ON TABLE discovery_mode_analytics IS 'Event tracking for discovery mode user behavior and interactions';

COMMENT ON COLUMN profile_details.bio IS 'User biography text displayed in About section';
COMMENT ON COLUMN profile_details.interests IS 'Array of interest tags displayed as chips';
COMMENT ON COLUMN profile_details.hobbies IS 'Array of hobby tags displayed in More Info section';
COMMENT ON COLUMN profile_photos.display_order IS 'Order in which photos appear in archive grid (0-indexed)';
COMMENT ON COLUMN discovery_mode_analytics.metadata IS 'JSON object containing event-specific data (scroll_position, duration, scroll_depth, etc.)';


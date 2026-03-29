/*
  # Clubs and User Club Associations

  ## Tables
  - clubs: Club/venue listings with location and contact info
  - user_clubs: User-club associations
  - user_club_roles: Roles per user per club
  - club_claims: Verification requests for club admin claims
  - court_availability: Admin-managed court time slots

  ## Security
  - RLS enabled with appropriate policies for club membership
*/

CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  location_lat double precision,
  location_lng double precision,
  phone text,
  email text,
  website text,
  booking_url text,
  logo_url text,
  cover_image_url text,
  is_claimed boolean DEFAULT false,
  claimed_by uuid REFERENCES profiles(id),
  sports sport_type[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view clubs"
  ON clubs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Club admins can update their clubs"
  ON clubs FOR UPDATE
  TO authenticated
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

CREATE TABLE IF NOT EXISTS user_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  is_home_club boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(user_id, club_id)
);

ALTER TABLE user_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view club memberships"
  ON user_clubs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join clubs"
  ON user_clubs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own club membership"
  ON user_clubs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clubs"
  ON user_clubs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_club_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  role club_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, club_id, role)
);

ALTER TABLE user_club_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view club roles"
  ON user_club_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can self-assign player or coach role"
  ON user_club_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own roles"
  ON user_club_roles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS club_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proof_description text NOT NULL,
  proof_document_url text,
  status claim_status DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE club_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON club_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit claims"
  ON club_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS court_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  court_name text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE court_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view court availability"
  ON court_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Club admins can manage court availability"
  ON court_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_club_roles ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.club_id = court_availability.club_id
      AND ucr.role = 'club_admin'
    )
  );

CREATE POLICY "Club admins can update court availability"
  ON court_availability FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_club_roles ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.club_id = court_availability.club_id
      AND ucr.role = 'club_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_club_roles ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.club_id = court_availability.club_id
      AND ucr.role = 'club_admin'
    )
  );

CREATE POLICY "Club admins can delete court availability"
  ON court_availability FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_club_roles ucr
      WHERE ucr.user_id = auth.uid()
      AND ucr.club_id = court_availability.club_id
      AND ucr.role = 'club_admin'
    )
  );

ALTER TABLE profiles ADD CONSTRAINT profiles_home_club_fkey 
  FOREIGN KEY (home_club_id) REFERENCES clubs(id) ON DELETE SET NULL;

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_clubs_user ON user_clubs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clubs_club ON user_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_user_club_roles_user ON user_club_roles(user_id);


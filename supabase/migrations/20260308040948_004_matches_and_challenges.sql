/*
  # Matches and Challenges

  ## Tables
  - matches: Match records with scores and metadata
  - match_players: Join table for match participants
  - challenges: Challenge lifecycle tracking
  - challenge_players: Join table for challenge participants

  ## Security
  - RLS enabled with appropriate policies
*/

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport sport_type NOT NULL,
  format match_format NOT NULL DEFAULT 'singles',
  club_id uuid REFERENCES clubs(id),
  ladder_id uuid,
  competition_id uuid,
  competition_fixture_id uuid,
  scheduled_at timestamptz,
  played_at timestamptz,
  score jsonb,
  score_status score_status DEFAULT 'pending',
  score_submitted_by uuid REFERENCES profiles(id),
  score_confirmed_by uuid REFERENCES profiles(id),
  dispute_reason text,
  winner_team integer CHECK (winner_team IN (1, 2)),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_number integer NOT NULL CHECK (team_number IN (1, 2)),
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, user_id)
);

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = matches.id
      AND mp.user_id = auth.uid()
    )
    OR club_id IN (
      SELECT club_id FROM user_clubs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Match participants can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = matches.id
      AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = matches.id
      AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Match players can view participants"
  ON match_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = match_players.match_id
      AND mp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM matches m
      JOIN user_clubs uc ON m.club_id = uc.club_id
      WHERE m.id = match_players.match_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can add match players"
  ON match_players FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport sport_type NOT NULL,
  format match_format NOT NULL DEFAULT 'singles',
  status challenge_status DEFAULT 'proposed',
  proposed_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  proposed_times jsonb,
  confirmed_time timestamptz,
  club_id uuid REFERENCES clubs(id),
  ladder_id uuid,
  court_name text,
  message text,
  match_id uuid REFERENCES matches(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS challenge_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_number integer NOT NULL CHECK (team_number IN (1, 2)),
  response text CHECK (response IN ('pending', 'accepted', 'declined')),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge participants can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    proposed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_players cp
      WHERE cp.challenge_id = challenges.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = proposed_by);

CREATE POLICY "Challenge participants can update challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (
    proposed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_players cp
      WHERE cp.challenge_id = challenges.id
      AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    proposed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_players cp
      WHERE cp.challenge_id = challenges.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Challenge players can view participants"
  ON challenge_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenge_players cp
      WHERE cp.challenge_id = challenge_players.challenge_id
      AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_players.challenge_id
      AND c.proposed_by = auth.uid()
    )
  );

CREATE POLICY "Challenge creators can add players"
  ON challenge_players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges c
      WHERE c.id = challenge_players.challenge_id
      AND c.proposed_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Players can update own response"
  ON challenge_players FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_matches_sport ON matches(sport);
CREATE INDEX IF NOT EXISTS idx_matches_club ON matches(club_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_proposed_by ON challenges(proposed_by);


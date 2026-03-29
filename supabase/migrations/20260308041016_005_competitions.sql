/*
  # Competitions - Ladders, Leagues, Tournaments

  ## Tables
  - ladders: Challenge ladders
  - ladder_members: Ladder membership and position
  - competitions: Leagues and tournaments
  - competition_entries: Registration for competitions
  - competition_fixtures: Scheduled matches within competitions
  - competition_standings: Current standings

  ## Security
  - RLS enabled with appropriate policies
*/

CREATE TABLE IF NOT EXISTS ladders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  format match_format NOT NULL DEFAULT 'singles',
  created_by uuid NOT NULL REFERENCES profiles(id),
  max_rank_gap integer DEFAULT 3,
  challenge_response_days integer DEFAULT 7,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ladders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view ladders"
  ON ladders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clubs uc
      WHERE uc.club_id = ladders.club_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Comp organizers can create ladders"
  ON ladders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Ladder creators can update ladders"
  ON ladders FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Ladder creators can delete ladders"
  ON ladders FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS ladder_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id uuid NOT NULL REFERENCES ladders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  position integer NOT NULL,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK ((user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL))
);

ALTER TABLE ladder_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view ladder members"
  ON ladder_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ladders l
      JOIN user_clubs uc ON l.club_id = uc.club_id
      WHERE l.id = ladder_members.ladder_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Ladder creators can manage members"
  ON ladder_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ladders l
      WHERE l.id = ladder_members.ladder_id
      AND l.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Ladder creators can update members"
  ON ladder_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ladders l
      WHERE l.id = ladder_members.ladder_id
      AND l.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ladders l
      WHERE l.id = ladder_members.ladder_id
      AND l.created_by = auth.uid()
    )
  );

CREATE POLICY "Ladder creators can remove members"
  ON ladder_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ladders l
      WHERE l.id = ladder_members.ladder_id
      AND l.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

ALTER TABLE matches ADD CONSTRAINT matches_ladder_id_fkey 
  FOREIGN KEY (ladder_id) REFERENCES ladders(id) ON DELETE SET NULL;

ALTER TABLE challenges ADD CONSTRAINT challenges_ladder_id_fkey 
  FOREIGN KEY (ladder_id) REFERENCES ladders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  format match_format NOT NULL DEFAULT 'singles',
  competition_type competition_type NOT NULL,
  competition_format competition_format NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  start_date date,
  end_date date,
  registration_deadline timestamptz,
  max_participants integer,
  min_skill_level text,
  max_skill_level text,
  is_active boolean DEFAULT true,
  bracket_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view competitions"
  ON competitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clubs uc
      WHERE uc.club_id = competitions.club_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Comp organizers can create competitions"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Competition creators can update"
  ON competitions FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Competition creators can delete"
  ON competitions FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

ALTER TABLE matches ADD CONSTRAINT matches_competition_id_fkey 
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  seed integer,
  registered_at timestamptz DEFAULT now(),
  CHECK ((user_id IS NOT NULL AND team_id IS NULL) OR (user_id IS NULL AND team_id IS NOT NULL))
);

ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competition entries"
  ON competition_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      JOIN user_clubs uc ON c.club_id = uc.club_id
      WHERE c.id = competition_entries.competition_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can register for competitions"
  ON competition_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from competitions"
  ON competition_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS competition_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  round integer NOT NULL,
  match_number integer,
  scheduled_at timestamptz,
  entry_1_id uuid REFERENCES competition_entries(id),
  entry_2_id uuid REFERENCES competition_entries(id),
  match_id uuid REFERENCES matches(id),
  winner_entry_id uuid REFERENCES competition_entries(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE competition_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view fixtures"
  ON competition_fixtures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      JOIN user_clubs uc ON c.club_id = uc.club_id
      WHERE c.id = competition_fixtures.competition_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Competition creators can manage fixtures"
  ON competition_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_fixtures.competition_id
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Competition creators can update fixtures"
  ON competition_fixtures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_fixtures.competition_id
      AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_fixtures.competition_id
      AND c.created_by = auth.uid()
    )
  );

ALTER TABLE matches ADD CONSTRAINT matches_competition_fixture_id_fkey 
  FOREIGN KEY (competition_fixture_id) REFERENCES competition_fixtures(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS competition_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  group_name text,
  position integer,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  matches_lost integer DEFAULT 0,
  sets_won integer DEFAULT 0,
  sets_lost integer DEFAULT 0,
  games_won integer DEFAULT 0,
  games_lost integer DEFAULT 0,
  points integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(competition_id, entry_id)
);

ALTER TABLE competition_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view standings"
  ON competition_standings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      JOIN user_clubs uc ON c.club_id = uc.club_id
      WHERE c.id = competition_standings.competition_id
      AND uc.user_id = auth.uid()
    )
  );

CREATE POLICY "Competition creators can manage standings"
  ON competition_standings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_standings.competition_id
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Competition creators can update standings"
  ON competition_standings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_standings.competition_id
      AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      WHERE c.id = competition_standings.competition_id
      AND c.created_by = auth.uid()
    )
  );

CREATE TRIGGER update_ladders_updated_at BEFORE UPDATE ON ladders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_matches_ladder ON matches(ladder_id);
CREATE INDEX IF NOT EXISTS idx_ladders_club ON ladders(club_id);
CREATE INDEX IF NOT EXISTS idx_competitions_club ON competitions(club_id);


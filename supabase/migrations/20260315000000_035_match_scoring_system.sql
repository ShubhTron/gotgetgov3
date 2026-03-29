/*
  # Match Scoring System

  ## New Tables
  - match_results: Stores submitted match scores
  - match_result_players: Join table for match result participants

  ## Altered Tables
  - challenges: Adds score_status column

  ## Security
  - RLS enabled with appropriate policies
*/

-- ============================================================
-- 1. match_results table
-- ============================================================
CREATE TABLE IF NOT EXISTS match_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   uuid REFERENCES challenges(id) ON DELETE SET NULL,
  sport          text NOT NULL,
  format         text NOT NULL DEFAULT 'singles',
  played_at      timestamptz NOT NULL DEFAULT now(),
  score          jsonb NOT NULL,
  winner_team    int CHECK (winner_team IN (1, 2)),
  submitted_by   uuid NOT NULL REFERENCES profiles(id),
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'disputed')),
  disputed_by    uuid REFERENCES profiles(id),
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. match_result_players table
-- ============================================================
CREATE TABLE IF NOT EXISTS match_result_players (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id   uuid NOT NULL REFERENCES match_results(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  team_number int NOT NULL CHECK (team_number IN (1, 2))
);

ALTER TABLE match_result_players ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Add score_status to challenges
-- ============================================================
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS score_status text NOT NULL DEFAULT 'not_played'
    CHECK (score_status IN ('not_played', 'score_pending', 'scored'));

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_match_results_challenge_id  ON match_results(challenge_id);
CREATE INDEX IF NOT EXISTS idx_match_results_submitted_by  ON match_results(submitted_by);
CREATE INDEX IF NOT EXISTS idx_match_results_status        ON match_results(status);
CREATE INDEX IF NOT EXISTS idx_match_result_players_result ON match_result_players(result_id);
CREATE INDEX IF NOT EXISTS idx_match_result_players_user   ON match_result_players(user_id);

-- ============================================================
-- 5. RLS Policies — match_results
-- ============================================================

DROP POLICY IF EXISTS "Match result players can view results" ON match_results;
DROP POLICY IF EXISTS "Authenticated users can insert match results" ON match_results;
DROP POLICY IF EXISTS "Submitter or opponent can update match results" ON match_results;

-- SELECT: submitter can always see their own results; other players via match_result_players
CREATE POLICY "Match result players can view results"
  ON match_results FOR SELECT
  TO authenticated
  USING (
    auth.uid() = submitted_by
    OR EXISTS (
      SELECT 1 FROM match_result_players mrp
      WHERE mrp.result_id = match_results.id
        AND mrp.user_id = auth.uid()
    )
  );

-- INSERT: any authenticated user can insert (submitted_by must equal their uid)
CREATE POLICY "Authenticated users can insert match results"
  ON match_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- UPDATE: submitter can update (e.g. status changes) OR opponent can confirm/dispute
CREATE POLICY "Submitter or opponent can update match results"
  ON match_results FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = submitted_by
    OR EXISTS (
      SELECT 1 FROM match_result_players mrp
      WHERE mrp.result_id = match_results.id
        AND mrp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = submitted_by
    OR EXISTS (
      SELECT 1 FROM match_result_players mrp
      WHERE mrp.result_id = match_results.id
        AND mrp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. RLS Policies — match_result_players
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view match result players" ON match_result_players;
DROP POLICY IF EXISTS "Authenticated users can insert match result players" ON match_result_players;

-- SELECT: any authenticated user (needed for joins in scoring service)
CREATE POLICY "Authenticated users can view match result players"
  ON match_result_players FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: any authenticated user
CREATE POLICY "Authenticated users can insert match result players"
  ON match_result_players FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 7. Add new notification types to the enum
-- ============================================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'score_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'score_confirmation_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'score_disputed';

NOTIFY pgrst, 'reload schema';


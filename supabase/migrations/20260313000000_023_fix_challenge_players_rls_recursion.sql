/*
  # Fix RLS Recursion for challenge_players

  ## Problem
  The `challenges` SELECT policy (from migration 018) checks `challenge_players`,
  and the `challenge_players` SELECT policy self-references `challenge_players`.
  This creates infinite recursion when querying challenges.

  Error: "infinite recursion detected in policy for relation challenge_players"

  ## Solution
  Create SECURITY DEFINER functions that bypass RLS to check challenge participation.
  Update both `challenges` and `challenge_players` policies to use these functions.
*/

-- Function to check if a user is a participant of a challenge (bypasses RLS)
CREATE OR REPLACE FUNCTION is_challenge_participant(p_challenge_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM challenge_players
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  );
$$;

-- Function to check if user proposed a challenge (bypasses RLS)
CREATE OR REPLACE FUNCTION is_challenge_proposer(p_challenge_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM challenges
    WHERE id = p_challenge_id AND proposed_by = p_user_id
  );
$$;

-- Fix challenges SELECT policy (uses the function instead of direct subquery)
DROP POLICY IF EXISTS "Challenge participants can view challenges" ON challenges;
CREATE POLICY "Challenge participants can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    is_open = true
    OR proposed_by = auth.uid()
    OR is_challenge_participant(id, auth.uid())
  );

-- Fix challenges UPDATE policy
DROP POLICY IF EXISTS "Challenge participants can update challenges" ON challenges;
CREATE POLICY "Challenge participants can update challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (
    proposed_by = auth.uid()
    OR is_challenge_participant(id, auth.uid())
  )
  WITH CHECK (
    proposed_by = auth.uid()
    OR is_challenge_participant(id, auth.uid())
  );

-- Fix challenge_players SELECT policy (uses function instead of self-referencing subquery)
DROP POLICY IF EXISTS "Challenge players can view participants" ON challenge_players;
CREATE POLICY "Challenge players can view participants"
  ON challenge_players FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_challenge_proposer(challenge_id, auth.uid())
    OR is_challenge_participant(challenge_id, auth.uid())
  );

-- Fix challenge_players INSERT policy (uses function instead of subquery on challenges)
DROP POLICY IF EXISTS "Challenge creators can add players" ON challenge_players;
CREATE POLICY "Challenge creators can add players"
  ON challenge_players FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR is_challenge_proposer(challenge_id, auth.uid())
  );


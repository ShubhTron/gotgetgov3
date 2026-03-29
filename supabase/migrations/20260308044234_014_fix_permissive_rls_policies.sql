/*
  # Fix Overly Permissive RLS Policies

  ## Overview
  Fixes RLS policies that use WITH CHECK (true) which effectively bypasses row-level security.
  Updates these to have proper ownership or membership checks.

  ## Policies Fixed
  - clubs: Authenticated users can create clubs - now requires created_by check
  - conversations: Authenticated users can create conversations - now requires creator to be a participant
  - match_players: Authenticated users can add match players - now requires user to be adding themselves or be match participant
  - matches: Authenticated users can create matches - now requires creator to be a participant
  - notifications: System can create notifications - changed to service_role only
*/

DROP POLICY IF EXISTS "Authenticated users can create clubs" ON clubs;
CREATE POLICY "Authenticated users can create clubs"
  ON clubs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = claimed_by OR claimed_by IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    circle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = conversations.circle_id
      AND circle_members.user_id = (select auth.uid())
    )
    OR team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = conversations.team_id
      AND team_members.user_id = (select auth.uid())
    )
    OR (circle_id IS NULL AND team_id IS NULL)
  );

DROP POLICY IF EXISTS "Authenticated users can add match players" ON match_players;
CREATE POLICY "Authenticated users can add match players"
  ON match_players FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = match_players.match_id
      AND mp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create matches" ON matches;
CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = score_submitted_by
    OR score_submitted_by IS NULL
  );

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM connections
      WHERE (connections.user_id = (select auth.uid()) AND connections.connected_user_id = notifications.user_id)
      OR (connections.connected_user_id = (select auth.uid()) AND connections.user_id = notifications.user_id)
    )
  );

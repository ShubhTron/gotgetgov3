/*
  # Optimize RLS Policies - Part 2

  ## Overview
  Updates RLS policies for connections, circles, teams tables.

  ## Tables Updated
  - connections
  - circles
  - circle_members
  - teams
  - team_members
*/

DROP POLICY IF EXISTS "Users can view own connections" ON connections;
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = connected_user_id);

DROP POLICY IF EXISTS "Users can create connections" ON connections;
CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update connections they're part of" ON connections;
CREATE POLICY "Users can update connections they're part of"
  ON connections FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = connected_user_id)
  WITH CHECK ((select auth.uid()) = user_id OR (select auth.uid()) = connected_user_id);

DROP POLICY IF EXISTS "Users can delete own connections" ON connections;
CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = connected_user_id);

DROP POLICY IF EXISTS "Circle members can view circles" ON circles;
CREATE POLICY "Circle members can view circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create circles" ON circles;
CREATE POLICY "Authenticated users can create circles"
  ON circles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Circle creators can update circles" ON circles;
CREATE POLICY "Circle creators can update circles"
  ON circles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Circle creators can delete circles" ON circles;
CREATE POLICY "Circle creators can delete circles"
  ON circles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Circle members can view membership" ON circle_members;
CREATE POLICY "Circle members can view membership"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Circle admins can add members" ON circle_members;
CREATE POLICY "Circle admins can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = (select auth.uid())
      AND cm.role = 'admin'
    )
    OR (select auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Circle admins can update members" ON circle_members;
CREATE POLICY "Circle admins can update members"
  ON circle_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = (select auth.uid())
      AND cm.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Circle admins or self can delete membership" ON circle_members;
CREATE POLICY "Circle admins or self can delete membership"
  ON circle_members FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = (select auth.uid())
      AND cm.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Team members can view teams" ON teams;
CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create teams" ON teams;
CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Team creators can update teams" ON teams;
CREATE POLICY "Team creators can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Team creators can delete teams" ON teams;
CREATE POLICY "Team creators can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Team members can view membership" ON team_members;
CREATE POLICY "Team members can view membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team creators can manage members" ON team_members;
CREATE POLICY "Team creators can manage members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = (select auth.uid())
    )
    OR (select auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Team members can leave" ON team_members;
CREATE POLICY "Team members can leave"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = (select auth.uid())
    )
  );

/*
  # Fix Circle and Team Creation Policies
  
  This migration fixes the chicken-and-egg problem where:
  1. User creates a circle but can't add themselves as admin
  2. User can't see their newly created circle
  
  ## Changes
  
  1. Update circles SELECT policy to allow creators to view their circles
  2. Update circle_members INSERT policy to allow circle creators to add initial admin
  3. Update teams SELECT policy to allow creators to view their teams
  4. Update team_members SELECT policy to allow creators to view members
*/

-- Drop and recreate circles SELECT policy to include creators
DROP POLICY IF EXISTS "Circle members can view circles" ON circles;
CREATE POLICY "Circle members and creators can view circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_members.circle_id = circles.id
      AND circle_members.user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate circle_members INSERT policy to allow creators to add first admin
DROP POLICY IF EXISTS "Circle admins can add members" ON circle_members;
CREATE POLICY "Circle creators and admins can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_members.circle_id
      AND circles.created_by = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = (SELECT auth.uid())
      AND cm.role = 'admin'
    )
  );

-- Drop and recreate circle_members SELECT policy to allow creators to view
DROP POLICY IF EXISTS "Circle members can view membership" ON circle_members;
CREATE POLICY "Circle members and creators can view membership"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circles
      WHERE circles.id = circle_members.circle_id
      AND circles.created_by = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate teams SELECT policy to include creators
DROP POLICY IF EXISTS "Team members can view teams" ON teams;
CREATE POLICY "Team members and creators can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate team_members SELECT policy to allow creators to view
DROP POLICY IF EXISTS "Team members can view membership" ON team_members;
CREATE POLICY "Team members and creators can view membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.created_by = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = (SELECT auth.uid())
    )
  );


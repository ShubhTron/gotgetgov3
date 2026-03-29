/*
  # Fix RLS Recursion Using Security Definer Functions
  
  The previous approach still caused recursion because:
  - circles SELECT -> subquery on circle_members -> circle_members SELECT policy -> subquery on circles -> recursion
  
  ## Solution
  
  Create SECURITY DEFINER functions that bypass RLS to check membership.
  These functions run with elevated privileges and don't trigger RLS policies on the tables they query.
  
  ## Changes
  
  1. Create helper functions with SECURITY DEFINER to check membership
  2. Update all affected policies to use these functions instead of subqueries
*/

-- Create function to check if user is member of a circle (bypasses RLS)
CREATE OR REPLACE FUNCTION is_circle_member(p_circle_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id AND user_id = p_user_id
  );
$$;

-- Create function to check if user is admin of a circle (bypasses RLS)
CREATE OR REPLACE FUNCTION is_circle_admin(p_circle_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id AND user_id = p_user_id AND role = 'admin'
  );
$$;

-- Create function to check if user created a circle (bypasses RLS)
CREATE OR REPLACE FUNCTION is_circle_creator(p_circle_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circles
    WHERE id = p_circle_id AND created_by = p_user_id
  );
$$;

-- Create function to check if user is member of a team (bypasses RLS)
CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$;

-- Create function to check if user created a team (bypasses RLS)
CREATE OR REPLACE FUNCTION is_team_creator(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id AND created_by = p_user_id
  );
$$;

-- Now update circles SELECT policy to use function
DROP POLICY IF EXISTS "Circle members and creators can view circles" ON circles;
CREATE POLICY "Circle members and creators can view circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR is_circle_member(id, auth.uid())
  );

-- Update circle_members SELECT policy to use function
DROP POLICY IF EXISTS "Circle members and creators can view membership" ON circle_members;
CREATE POLICY "Circle members and creators can view membership"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_circle_creator(circle_id, auth.uid())
    OR is_circle_member(circle_id, auth.uid())
  );

-- Update circle_members INSERT policy to use function
DROP POLICY IF EXISTS "Circle creators and admins can add members" ON circle_members;
CREATE POLICY "Circle creators and admins can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR is_circle_creator(circle_id, auth.uid())
    OR is_circle_admin(circle_id, auth.uid())
  );

-- Update circle_members UPDATE policy to use function
DROP POLICY IF EXISTS "Circle admins can update members" ON circle_members;
CREATE POLICY "Circle admins can update members"
  ON circle_members FOR UPDATE
  TO authenticated
  USING (is_circle_admin(circle_id, auth.uid()))
  WITH CHECK (is_circle_admin(circle_id, auth.uid()));

-- Update circle_members DELETE policy to use function
DROP POLICY IF EXISTS "Circle admins or self can delete membership" ON circle_members;
CREATE POLICY "Circle admins or self can delete membership"
  ON circle_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_circle_admin(circle_id, auth.uid())
  );

-- Update teams SELECT policy to use function
DROP POLICY IF EXISTS "Team members and creators can view teams" ON teams;
CREATE POLICY "Team members and creators can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR is_team_member(id, auth.uid())
  );

-- Update team_members SELECT policy to use function
DROP POLICY IF EXISTS "Team members and creators can view membership" ON team_members;
CREATE POLICY "Team members and creators can view membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_team_creator(team_id, auth.uid())
    OR is_team_member(team_id, auth.uid())
  );

-- Update team_members INSERT policy to use function
DROP POLICY IF EXISTS "Team creators can manage members" ON team_members;
CREATE POLICY "Team creators can manage members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR is_team_creator(team_id, auth.uid())
  );

-- Update team_members DELETE policy to use function
DROP POLICY IF EXISTS "Team members can leave" ON team_members;
CREATE POLICY "Team members can leave"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_team_creator(team_id, auth.uid())
  );

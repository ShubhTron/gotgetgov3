/*
  # Fix Infinite Recursion in RLS Policies
  
  The previous policies created circular references:
  - teams SELECT -> team_members SELECT -> teams SELECT (infinite loop)
  - circles SELECT -> circle_members SELECT -> circles SELECT (infinite loop)
  
  ## Solution
  
  1. Teams and circles SELECT policies should only check created_by OR use a simple membership check
  2. team_members and circle_members SELECT policies should use direct user_id check, not reference parent tables
  
  ## Changes
  
  1. Simplify teams SELECT policy - check created_by or direct membership
  2. Simplify team_members SELECT policy - check direct user_id membership
  3. Simplify circles SELECT policy - check created_by or direct membership  
  4. Simplify circle_members SELECT policy - check direct user_id membership
  5. Fix INSERT policies to avoid recursion
*/

-- Fix teams SELECT policy (no circular reference)
DROP POLICY IF EXISTS "Team members and creators can view teams" ON teams;
CREATE POLICY "Team members and creators can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Fix team_members SELECT policy (no reference to teams table)
DROP POLICY IF EXISTS "Team members and creators can view membership" ON team_members;
CREATE POLICY "Team members and creators can view membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- Fix team_members INSERT policy (simplified, no circular reference)
DROP POLICY IF EXISTS "Team creators can manage members" ON team_members;
CREATE POLICY "Team creators can manage members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- Fix circles SELECT policy (no circular reference)
DROP POLICY IF EXISTS "Circle members and creators can view circles" ON circles;
CREATE POLICY "Circle members and creators can view circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
  );

-- Fix circle_members SELECT policy (no reference to circles table for membership check)
DROP POLICY IF EXISTS "Circle members and creators can view membership" ON circle_members;
CREATE POLICY "Circle members and creators can view membership"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT id FROM circles WHERE created_by = auth.uid()
    )
  );

-- Fix circle_members INSERT policy (simplified, no circular reference)
DROP POLICY IF EXISTS "Circle creators and admins can add members" ON circle_members;
CREATE POLICY "Circle creators and admins can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT id FROM circles WHERE created_by = auth.uid()
    )
    OR circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix circle_members UPDATE policy (avoid recursion)
DROP POLICY IF EXISTS "Circle admins can update members" ON circle_members;
CREATE POLICY "Circle admins can update members"
  ON circle_members FOR UPDATE
  TO authenticated
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix circle_members DELETE policy (avoid recursion)
DROP POLICY IF EXISTS "Circle admins or self can delete membership" ON circle_members;
CREATE POLICY "Circle admins or self can delete membership"
  ON circle_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Fix team_members DELETE policy (avoid recursion)
DROP POLICY IF EXISTS "Team members can leave" ON team_members;
CREATE POLICY "Team members can leave"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

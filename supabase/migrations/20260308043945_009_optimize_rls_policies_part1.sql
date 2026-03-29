/*
  # Optimize RLS Policies - Part 1

  ## Overview
  Updates RLS policies to use (select auth.uid()) instead of auth.uid() directly.
  This prevents re-evaluation of the auth function for each row, improving query performance.

  ## Tables Updated
  - profiles
  - user_sport_profiles
  - user_club_roles
  - clubs
  - user_clubs
  - club_claims
  - court_availability
*/

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can manage own sport profiles" ON user_sport_profiles;
CREATE POLICY "Users can manage own sport profiles"
  ON user_sport_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sport profiles" ON user_sport_profiles;
CREATE POLICY "Users can update own sport profiles"
  ON user_sport_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own sport profiles" ON user_sport_profiles;
CREATE POLICY "Users can delete own sport profiles"
  ON user_sport_profiles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can self-assign player or coach role" ON user_club_roles;
CREATE POLICY "Users can self-assign player or coach role"
  ON user_club_roles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id AND role IN ('player', 'coach'));

DROP POLICY IF EXISTS "Users can remove own roles" ON user_club_roles;
CREATE POLICY "Users can remove own roles"
  ON user_club_roles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Club admins can update their clubs" ON clubs;
CREATE POLICY "Club admins can update their clubs"
  ON clubs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE user_club_roles.club_id = clubs.id
      AND user_club_roles.user_id = (select auth.uid())
      AND user_club_roles.role = 'club_admin'
    )
  );

DROP POLICY IF EXISTS "Users can join clubs" ON user_clubs;
CREATE POLICY "Users can join clubs"
  ON user_clubs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own club membership" ON user_clubs;
CREATE POLICY "Users can update own club membership"
  ON user_clubs FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can leave clubs" ON user_clubs;
CREATE POLICY "Users can leave clubs"
  ON user_clubs FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own claims" ON club_claims;
CREATE POLICY "Users can view own claims"
  ON club_claims FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can submit claims" ON club_claims;
CREATE POLICY "Users can submit claims"
  ON club_claims FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Club admins can manage court availability" ON court_availability;
CREATE POLICY "Club admins can manage court availability"
  ON court_availability FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE user_club_roles.club_id = court_availability.club_id
      AND user_club_roles.user_id = (select auth.uid())
      AND user_club_roles.role = 'club_admin'
    )
  );

DROP POLICY IF EXISTS "Club admins can update court availability" ON court_availability;
CREATE POLICY "Club admins can update court availability"
  ON court_availability FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE user_club_roles.club_id = court_availability.club_id
      AND user_club_roles.user_id = (select auth.uid())
      AND user_club_roles.role = 'club_admin'
    )
  );

DROP POLICY IF EXISTS "Club admins can delete court availability" ON court_availability;
CREATE POLICY "Club admins can delete court availability"
  ON court_availability FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE user_club_roles.club_id = court_availability.club_id
      AND user_club_roles.user_id = (select auth.uid())
      AND user_club_roles.role = 'club_admin'
    )
  );

/*
  # Optimize RLS Policies - Part 3

  ## Overview
  Updates RLS policies for matches, challenges, events, ladders, competitions tables.

  ## Tables Updated
  - matches
  - match_players
  - challenges
  - challenge_players
  - events
  - event_registrations
  - ladders
  - ladder_members
  - competitions
  - competition_entries
  - competition_fixtures
  - competition_standings
*/

DROP POLICY IF EXISTS "Match participants can view matches" ON matches;
CREATE POLICY "Match participants can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players
      WHERE match_players.match_id = matches.id
      AND match_players.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create matches" ON matches;
CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Match participants can update matches" ON matches;
CREATE POLICY "Match participants can update matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players
      WHERE match_players.match_id = matches.id
      AND match_players.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Match players can view participants" ON match_players;
CREATE POLICY "Match players can view participants"
  ON match_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_players mp
      WHERE mp.match_id = match_players.match_id
      AND mp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can add match players" ON match_players;
CREATE POLICY "Authenticated users can add match players"
  ON match_players FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Challenge participants can view challenges" ON challenges;
CREATE POLICY "Challenge participants can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenge_players
      WHERE challenge_players.challenge_id = challenges.id
      AND challenge_players.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create challenges" ON challenges;
CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = proposed_by);

DROP POLICY IF EXISTS "Challenge participants can update challenges" ON challenges;
CREATE POLICY "Challenge participants can update challenges"
  ON challenges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenge_players
      WHERE challenge_players.challenge_id = challenges.id
      AND challenge_players.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Challenge players can view participants" ON challenge_players;
CREATE POLICY "Challenge players can view participants"
  ON challenge_players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM challenge_players cp
      WHERE cp.challenge_id = challenge_players.challenge_id
      AND cp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Challenge creators can add players" ON challenge_players;
CREATE POLICY "Challenge creators can add players"
  ON challenge_players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_players.challenge_id
      AND challenges.proposed_by = (select auth.uid())
    )
    OR (select auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Players can update own response" ON challenge_players;
CREATE POLICY "Players can update own response"
  ON challenge_players FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Club members can view events" ON events;
CREATE POLICY "Club members can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    is_casual = true
    OR EXISTS (
      SELECT 1 FROM user_clubs
      WHERE user_clubs.club_id = events.club_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create events" ON events;
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Event creators can update events" ON events;
CREATE POLICY "Event creators can update events"
  ON events FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Event creators can delete events" ON events;
CREATE POLICY "Event creators can delete events"
  ON events FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Event participants can view registrations" ON event_registrations;
CREATE POLICY "Event participants can view registrations"
  ON event_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_registrations er
      WHERE er.event_id = event_registrations.event_id
      AND er.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can register for events" ON event_registrations;
CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unregister from events" ON event_registrations;
CREATE POLICY "Users can unregister from events"
  ON event_registrations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Club members can view ladders" ON ladders;
CREATE POLICY "Club members can view ladders"
  ON ladders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      WHERE user_clubs.club_id = ladders.club_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Comp organizers can create ladders" ON ladders;
CREATE POLICY "Comp organizers can create ladders"
  ON ladders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE user_club_roles.club_id = ladders.club_id
      AND user_club_roles.user_id = (select auth.uid())
      AND user_club_roles.role IN ('comp_organizer', 'club_admin')
    )
  );

DROP POLICY IF EXISTS "Ladder creators can update ladders" ON ladders;
CREATE POLICY "Ladder creators can update ladders"
  ON ladders FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Ladder creators can delete ladders" ON ladders;
CREATE POLICY "Ladder creators can delete ladders"
  ON ladders FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Club members can view ladder members" ON ladder_members;
CREATE POLICY "Club members can view ladder members"
  ON ladder_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ladders
      JOIN user_clubs ON user_clubs.club_id = ladders.club_id
      WHERE ladders.id = ladder_members.ladder_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Ladder creators can manage members" ON ladder_members;
CREATE POLICY "Ladder creators can manage members"
  ON ladder_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ladders
      WHERE ladders.id = ladder_members.ladder_id
      AND ladders.created_by = (select auth.uid())
    )
    OR (select auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Ladder creators can update members" ON ladder_members;
CREATE POLICY "Ladder creators can update members"
  ON ladder_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ladders
      WHERE ladders.id = ladder_members.ladder_id
      AND ladders.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Ladder creators can remove members" ON ladder_members;
CREATE POLICY "Ladder creators can remove members"
  ON ladder_members FOR DELETE
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM ladders
      WHERE ladders.id = ladder_members.ladder_id
      AND ladders.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Club members can view competitions" ON competitions;
CREATE POLICY "Club members can view competitions"
  ON competitions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      WHERE user_clubs.club_id = competitions.club_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Comp organizers can create competitions" ON competitions;
CREATE POLICY "Comp organizers can create competitions"
  ON competitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE user_club_roles.club_id = competitions.club_id
      AND user_club_roles.user_id = (select auth.uid())
      AND user_club_roles.role IN ('comp_organizer', 'club_admin')
    )
  );

DROP POLICY IF EXISTS "Competition creators can update" ON competitions;
CREATE POLICY "Competition creators can update"
  ON competitions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Competition creators can delete" ON competitions;
CREATE POLICY "Competition creators can delete"
  ON competitions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Anyone can view competition entries" ON competition_entries;
CREATE POLICY "Anyone can view competition entries"
  ON competition_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      JOIN user_clubs ON user_clubs.club_id = competitions.club_id
      WHERE competitions.id = competition_entries.competition_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can register for competitions" ON competition_entries;
CREATE POLICY "Users can register for competitions"
  ON competition_entries FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can withdraw from competitions" ON competition_entries;
CREATE POLICY "Users can withdraw from competitions"
  ON competition_entries FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Club members can view fixtures" ON competition_fixtures;
CREATE POLICY "Club members can view fixtures"
  ON competition_fixtures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      JOIN user_clubs ON user_clubs.club_id = competitions.club_id
      WHERE competitions.id = competition_fixtures.competition_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Competition creators can manage fixtures" ON competition_fixtures;
CREATE POLICY "Competition creators can manage fixtures"
  ON competition_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_fixtures.competition_id
      AND competitions.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Competition creators can update fixtures" ON competition_fixtures;
CREATE POLICY "Competition creators can update fixtures"
  ON competition_fixtures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_fixtures.competition_id
      AND competitions.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Club members can view standings" ON competition_standings;
CREATE POLICY "Club members can view standings"
  ON competition_standings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      JOIN user_clubs ON user_clubs.club_id = competitions.club_id
      WHERE competitions.id = competition_standings.competition_id
      AND user_clubs.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Competition creators can manage standings" ON competition_standings;
CREATE POLICY "Competition creators can manage standings"
  ON competition_standings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_standings.competition_id
      AND competitions.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Competition creators can update standings" ON competition_standings;
CREATE POLICY "Competition creators can update standings"
  ON competition_standings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM competitions
      WHERE competitions.id = competition_standings.competition_id
      AND competitions.created_by = (select auth.uid())
    )
  );

/*
  # Add Missing Foreign Key Indexes

  ## Overview
  Adds indexes on foreign key columns that were missing, improving JOIN performance
  and preventing table scans during cascading deletes.

  ## Indexes Added
  - availability: user_id
  - challenge_players: user_id
  - challenges: club_id, ladder_id, match_id
  - circle_members: user_id
  - circles: created_by
  - club_claims: club_id, reviewed_by, user_id
  - clubs: claimed_by
  - coach_sessions: club_id, coach_id, student_id
  - competition_entries: competition_id, team_id, user_id
  - competition_fixtures: competition_id, entry_1_id, entry_2_id, match_id, winner_entry_id
  - competition_standings: entry_id
  - competitions: created_by
  - connections: connected_user_id
  - conversation_participants: user_id
  - conversations: circle_id, team_id
  - court_availability: club_id
  - event_registrations: user_id
  - events: created_by
  - feed_comments: feed_item_id, user_id
  - feed_items: author_id, related_competition_id, related_event_id, related_ladder_id, related_match_id
  - feed_reactions: user_id
  - ladder_members: ladder_id, team_id, user_id
  - ladders: created_by
  - match_players: user_id
  - matches: competition_fixture_id, competition_id, score_confirmed_by, score_submitted_by
  - messages: sender_id
  - profiles: home_club_id
  - team_members: user_id
  - teams: created_by
  - user_club_roles: club_id
*/

CREATE INDEX IF NOT EXISTS idx_availability_user_id ON availability(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_players_user_id ON challenge_players(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_club_id ON challenges(club_id);
CREATE INDEX IF NOT EXISTS idx_challenges_ladder_id ON challenges(ladder_id);
CREATE INDEX IF NOT EXISTS idx_challenges_match_id ON challenges(match_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_circles_created_by ON circles(created_by);
CREATE INDEX IF NOT EXISTS idx_club_claims_club_id ON club_claims(club_id);
CREATE INDEX IF NOT EXISTS idx_club_claims_reviewed_by ON club_claims(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_club_claims_user_id ON club_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_clubs_claimed_by ON clubs(claimed_by);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_club_id ON coach_sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_coach_id ON coach_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_student_id ON coach_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_id ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_team_id ON competition_entries(team_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_user_id ON competition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_fixtures_competition_id ON competition_fixtures(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_fixtures_entry_1_id ON competition_fixtures(entry_1_id);
CREATE INDEX IF NOT EXISTS idx_competition_fixtures_entry_2_id ON competition_fixtures(entry_2_id);
CREATE INDEX IF NOT EXISTS idx_competition_fixtures_match_id ON competition_fixtures(match_id);
CREATE INDEX IF NOT EXISTS idx_competition_fixtures_winner_entry_id ON competition_fixtures(winner_entry_id);
CREATE INDEX IF NOT EXISTS idx_competition_standings_entry_id ON competition_standings(entry_id);
CREATE INDEX IF NOT EXISTS idx_competitions_created_by ON competitions(created_by);
CREATE INDEX IF NOT EXISTS idx_connections_connected_user_id ON connections(connected_user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_circle_id ON conversations(circle_id);
CREATE INDEX IF NOT EXISTS idx_conversations_team_id ON conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_court_availability_club_id ON court_availability(club_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_feed_comments_feed_item_id ON feed_comments(feed_item_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_user_id ON feed_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_author_id ON feed_items(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_related_competition_id ON feed_items(related_competition_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_related_event_id ON feed_items(related_event_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_related_ladder_id ON feed_items(related_ladder_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_related_match_id ON feed_items(related_match_id);
CREATE INDEX IF NOT EXISTS idx_feed_reactions_user_id ON feed_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ladder_members_ladder_id ON ladder_members(ladder_id);
CREATE INDEX IF NOT EXISTS idx_ladder_members_team_id ON ladder_members(team_id);
CREATE INDEX IF NOT EXISTS idx_ladder_members_user_id ON ladder_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ladders_created_by ON ladders(created_by);
CREATE INDEX IF NOT EXISTS idx_match_players_user_id ON match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_competition_fixture_id ON matches(competition_fixture_id);
CREATE INDEX IF NOT EXISTS idx_matches_competition_id ON matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_score_confirmed_by ON matches(score_confirmed_by);
CREATE INDEX IF NOT EXISTS idx_matches_score_submitted_by ON matches(score_submitted_by);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_profiles_home_club_id ON profiles(home_club_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_user_club_roles_club_id ON user_club_roles(club_id);

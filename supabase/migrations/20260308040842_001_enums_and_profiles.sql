/*
  # GotGetGo Core Enums and Profiles

  ## Overview
  Creates the foundational enum types and user profiles table for GotGetGo.

  ## Enum Types
  - sport_type: 11 supported racquet sports
  - club_role: player, coach, comp_organizer, club_admin
  - challenge_status: challenge lifecycle states
  - match_format: singles, doubles
  - competition_type: league, tournament, ladder
  - competition_format: round_robin, group_stage, single/double elimination, swiss
  - score_status: pending, confirmed, disputed
  - claim_status: pending, approved, rejected
  - notification_type: various notification categories
  - feed_item_type: feed content types
  - audience_type: announcement targeting

  ## Tables
  - profiles: User profiles with location, bio, avatar, and settings

  ## Security
  - RLS enabled with appropriate policies
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sport_type') THEN
    CREATE TYPE sport_type AS ENUM (
      'platform_tennis',
      'padel',
      'tennis',
      'squash',
      'pickleball',
      'golf',
      'badminton',
      'table_tennis',
      'racquetball_squash57',
      'beach_tennis',
      'real_tennis'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_role') THEN
    CREATE TYPE club_role AS ENUM ('player', 'coach', 'comp_organizer', 'club_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
    CREATE TYPE challenge_status AS ENUM ('proposed', 'accepted', 'confirmed', 'played', 'scored', 'declined', 'expired', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_format') THEN
    CREATE TYPE match_format AS ENUM ('singles', 'doubles');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competition_type') THEN
    CREATE TYPE competition_type AS ENUM ('league', 'tournament', 'ladder');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competition_format') THEN
    CREATE TYPE competition_format AS ENUM ('round_robin', 'group_stage', 'single_elimination', 'double_elimination', 'swiss');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'score_status') THEN
    CREATE TYPE score_status AS ENUM ('pending', 'confirmed', 'disputed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
    CREATE TYPE claim_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'challenge_received',
      'challenge_accepted',
      'challenge_declined',
      'match_result',
      'ladder_position_change',
      'event_invite',
      'circle_invite',
      'team_invite',
      'competition_update',
      'announcement',
      'system'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feed_item_type') THEN
    CREATE TYPE feed_item_type AS ENUM (
      'announcement',
      'match_result',
      'ladder_movement',
      'event',
      'achievement',
      'recommendation'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audience_type') THEN
    CREATE TYPE audience_type AS ENUM ('circle', 'club', 'event', 'competition', 'public');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text DEFAULT '',
  phone text,
  location_lat double precision,
  location_lng double precision,
  location_city text,
  location_country text,
  home_club_id uuid,
  onboarding_completed boolean DEFAULT false,
  dark_mode boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS user_sport_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  self_assessed_level text NOT NULL DEFAULT 'beginner',
  official_rating text,
  official_rating_system text,
  play_style text,
  preferred_format match_format DEFAULT 'singles',
  years_playing integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sport)
);

ALTER TABLE user_sport_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any sport profile"
  ON user_sport_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own sport profiles"
  ON user_sport_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sport profiles"
  ON user_sport_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sport profiles"
  ON user_sport_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_sport_profiles_updated_at BEFORE UPDATE ON user_sport_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_user ON user_sport_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_sport ON user_sport_profiles(sport);


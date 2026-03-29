/*
  # Onboarding Roles & Coach Setup

  ## Overview
  Adds new tables for user platform roles, coach profiles, coach sports,
  coach lesson packages, and broadcast channels. Also alters existing
  clubs and user_clubs tables with new columns.

  ## New Tables
  - user_roles: platform-level roles per user
  - coach_profiles: one coach profile per user
  - coach_sports: sports a coach teaches with per-sport specialties
  - coach_lessons: lesson packages offered by a coach
  - broadcast_channels: one broadcast channel per club, created by club admin

  ## Alterations
  - clubs: add created_by (uuid FK → profiles) and is_verified (boolean)
  - user_clubs: add role (club_role DEFAULT 'player')

  ## Security
  - RLS enabled on all new tables with appropriate policies

  ## Requirements
  - 12.1–12.5, 13.1–13.3, 14.1–14.3, 15.1–15.2, 16.1–16.3, 17.1,
    18.1–18.4, 22.1–22.7
*/

-- ============================================================
-- NEW TABLES
-- ============================================================

-- user_roles: platform-level roles per user
CREATE TABLE IF NOT EXISTS user_roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        club_role NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- coach_profiles: one per coach user
CREATE TABLE IF NOT EXISTS coach_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio              text,
  years_experience integer,
  certifications   text[] DEFAULT '{}',
  is_active        boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- coach_sports: sports a coach teaches
CREATE TABLE IF NOT EXISTS coach_sports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_profile_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  sport            sport_type NOT NULL,
  specialties      text[] DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  UNIQUE(coach_profile_id, sport)
);

-- coach_lessons: lesson packages offered by a coach
CREATE TABLE IF NOT EXISTS coach_lessons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_profile_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  name             text NOT NULL,
  duration_minutes integer NOT NULL,
  price            numeric(10,2),
  currency         text DEFAULT 'USD',
  is_package       boolean DEFAULT false,
  package_count    integer,
  created_at       timestamptz DEFAULT now()
);

-- broadcast_channels: one per club, created by club admin
CREATE TABLE IF NOT EXISTS broadcast_channels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id),
  name       text NOT NULL DEFAULT 'Announcements',
  created_at timestamptz DEFAULT now(),
  UNIQUE(club_id)
);

-- ============================================================
-- ALTERATIONS TO EXISTING TABLES
-- ============================================================

-- clubs: track creator and verification status
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- user_clubs: track membership role
ALTER TABLE user_clubs ADD COLUMN IF NOT EXISTS role club_role DEFAULT 'player';

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert non-player roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role <> 'player');

CREATE POLICY "Users delete non-player roles"
  ON user_roles FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND role <> 'player');

-- coach_profiles
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active coach profiles"
  ON coach_profiles FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = user_id);

CREATE POLICY "Users manage own coach profile"
  ON coach_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own coach profile"
  ON coach_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- coach_sports
ALTER TABLE coach_sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads coach sports"
  ON coach_sports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches manage own sports"
  ON coach_sports FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coach_profiles cp WHERE cp.id = coach_profile_id AND cp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM coach_profiles cp WHERE cp.id = coach_profile_id AND cp.user_id = auth.uid())
  );

-- coach_lessons
ALTER TABLE coach_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads coach lessons"
  ON coach_lessons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Coaches manage own lessons"
  ON coach_lessons FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM coach_profiles cp WHERE cp.id = coach_profile_id AND cp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM coach_profiles cp WHERE cp.id = coach_profile_id AND cp.user_id = auth.uid())
  );

-- broadcast_channels
ALTER TABLE broadcast_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members read channels"
  ON broadcast_channels FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_clubs uc WHERE uc.club_id = broadcast_channels.club_id AND uc.user_id = auth.uid())
  );

CREATE POLICY "Club admins insert channels"
  ON broadcast_channels FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clubs uc
      WHERE uc.club_id = broadcast_channels.club_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'club_admin'
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user         ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user     ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_sports_profile    ON coach_sports(coach_profile_id);
CREATE INDEX IF NOT EXISTS idx_coach_lessons_profile   ON coach_lessons(coach_profile_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_channels_club ON broadcast_channels(club_id);

-- ============================================================
-- updated_at trigger for coach_profiles
-- ============================================================

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

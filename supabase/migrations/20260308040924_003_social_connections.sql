/*
  # Social Connections - Connections, Circles, Teams

  ## Tables
  - connections: Player-to-player connections
  - circles: Named groups for organizing play
  - circle_members: Circle membership
  - teams: Persistent doubles pairs
  - team_members: Team membership

  ## Security
  - RLS enabled with appropriate policies
*/

CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connected_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, connected_user_id),
  CHECK (user_id != connected_user_id)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections"
  ON connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update connections they're part of"
  ON connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can delete own connections"
  ON connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS circle_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(circle_id, user_id)
);

ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view circles"
  ON circles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circles.id
      AND cm.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create circles"
  ON circles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle creators can update circles"
  ON circles FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Circle creators can delete circles"
  ON circles FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Circle members can view membership"
  ON circle_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id
      AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM circles c
      WHERE c.id = circle_members.circle_id
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Circle admins can add members"
  ON circle_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circles c
      WHERE c.id = circle_members.circle_id
      AND c.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Circle admins can update members"
  ON circle_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM circles c
      WHERE c.id = circle_members.circle_id
      AND c.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM circles c
      WHERE c.id = circle_members.circle_id
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Circle admins or self can delete membership"
  ON circle_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM circles c
      WHERE c.id = circle_members.circle_id
      AND c.created_by = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = teams.id
      AND tm.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Team members can view membership"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can manage members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Team members can leave"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.created_by = auth.uid()
    )
  );


/*
  # Events, Coaching, Messaging, Notifications

  ## Tables
  - events: Open play, round robins, meetups, clinics
  - event_registrations: Event sign-ups
  - coach_profiles: Coach-specific data
  - coach_sessions: Coaching lessons
  - conversations: Chat conversations
  - conversation_participants: Chat participants
  - messages: Chat messages
  - feed_items: News feed content
  - feed_reactions: Reactions on feed items
  - feed_comments: Comments on feed items
  - notifications: Notification queue
  - availability: Recurring availability patterns
  - swipe_matches: For opponent matching deck

  ## Security
  - RLS enabled with appropriate policies
*/

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  sport sport_type,
  created_by uuid NOT NULL REFERENCES profiles(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  court_name text,
  max_participants integer,
  is_casual boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    club_id IS NULL
    OR EXISTS (
      SELECT 1 FROM user_clubs uc
      WHERE uc.club_id = events.club_id
      AND uc.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event participants can view registrations"
  ON event_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_registrations.event_id
      AND (
        e.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_clubs uc
          WHERE uc.club_id = e.club_id
          AND uc.user_id = auth.uid()
        )
      )
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can register for events"
  ON event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from events"
  ON event_registrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS coach_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio text DEFAULT '',
  specialties text[] DEFAULT '{}',
  certifications text[] DEFAULT '{}',
  hourly_rate decimal(10, 2),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view coach profiles"
  ON coach_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own coach profile"
  ON coach_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coach profile"
  ON coach_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own coach profile"
  ON coach_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  club_id uuid REFERENCES clubs(id),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session participants can view sessions"
  ON coach_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles cp
      WHERE cp.id = coach_sessions.coach_id
      AND cp.user_id = auth.uid()
    )
    OR student_id = auth.uid()
  );

CREATE POLICY "Coaches can create sessions"
  ON coach_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles cp
      WHERE cp.id = coach_sessions.coach_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Session participants can update sessions"
  ON coach_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_profiles cp
      WHERE cp.id = coach_sessions.coach_id
      AND cp.user_id = auth.uid()
    )
    OR student_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_profiles cp
      WHERE cp.id = coach_sessions.coach_id
      AND cp.user_id = auth.uid()
    )
    OR student_id = auth.uid()
  );

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'circle', 'team')),
  circle_id uuid REFERENCES circles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can add to conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  encrypted_content text,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type feed_item_type NOT NULL,
  title text,
  content text,
  image_url text,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  audience_type audience_type NOT NULL DEFAULT 'club',
  audience_id uuid,
  related_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  related_ladder_id uuid REFERENCES ladders(id) ON DELETE SET NULL,
  related_competition_id uuid REFERENCES competitions(id) ON DELETE SET NULL,
  related_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant feed items"
  ON feed_items FOR SELECT
  TO authenticated
  USING (
    audience_type = 'public'
    OR (audience_type = 'club' AND EXISTS (
      SELECT 1 FROM user_clubs uc
      WHERE uc.club_id = feed_items.club_id
      AND uc.user_id = auth.uid()
    ))
    OR (audience_type = 'circle' AND EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = feed_items.audience_id
      AND cm.user_id = auth.uid()
    ))
    OR (audience_type = 'event' AND EXISTS (
      SELECT 1 FROM event_registrations er
      WHERE er.event_id = feed_items.audience_id
      AND er.user_id = auth.uid()
    ))
    OR (audience_type = 'competition' AND EXISTS (
      SELECT 1 FROM competition_entries ce
      WHERE ce.competition_id = feed_items.audience_id
      AND ce.user_id = auth.uid()
    ))
    OR author_id = auth.uid()
  );

CREATE POLICY "Users can create feed items"
  ON feed_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update feed items"
  ON feed_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete feed items"
  ON feed_items FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id uuid NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'celebrate', 'fire')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(feed_item_id, user_id)
);

ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON feed_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add reactions"
  ON feed_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON feed_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id uuid NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON feed_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add comments"
  ON feed_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON feed_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
  ON availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own availability"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability"
  ON availability FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own availability"
  ON availability FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS swipe_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport sport_type NOT NULL,
  direction text NOT NULL CHECK (direction IN ('left', 'right')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, target_user_id, sport)
);

ALTER TABLE swipe_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipes"
  ON swipe_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create swipes"
  ON swipe_matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_events_club ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_feed_items_club ON feed_items(club_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_created ON feed_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_swipe_matches_user ON swipe_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_matches_target ON swipe_matches(target_user_id);


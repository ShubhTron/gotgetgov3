/*
  # Optimize RLS Policies - Part 4

  ## Overview
  Updates RLS policies for coaching, messaging, feed, notifications, availability, and swipe tables.

  ## Tables Updated
  - coach_profiles
  - coach_sessions
  - conversations
  - conversation_participants
  - messages
  - feed_items
  - feed_reactions
  - feed_comments
  - notifications
  - availability
  - swipe_matches
*/

DROP POLICY IF EXISTS "Users can create own coach profile" ON coach_profiles;
CREATE POLICY "Users can create own coach profile"
  ON coach_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own coach profile" ON coach_profiles;
CREATE POLICY "Users can update own coach profile"
  ON coach_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own coach profile" ON coach_profiles;
CREATE POLICY "Users can delete own coach profile"
  ON coach_profiles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Session participants can view sessions" ON coach_sessions;
CREATE POLICY "Session participants can view sessions"
  ON coach_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = coach_id OR (select auth.uid()) = student_id);

DROP POLICY IF EXISTS "Coaches can create sessions" ON coach_sessions;
CREATE POLICY "Coaches can create sessions"
  ON coach_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Session participants can update sessions" ON coach_sessions;
CREATE POLICY "Session participants can update sessions"
  ON coach_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = coach_id OR (select auth.uid()) = student_id);

DROP POLICY IF EXISTS "Conversation participants can view conversations" ON conversations;
CREATE POLICY "Conversation participants can view conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can add to conversations" ON conversation_participants;
CREATE POLICY "Participants can add to conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = (select auth.uid())
    )
    OR (select auth.uid()) = user_id
  );

DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own participant record" ON conversation_participants;
CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Conversation participants can view messages" ON messages;
CREATE POLICY "Conversation participants can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view relevant feed items" ON feed_items;
CREATE POLICY "Users can view relevant feed items"
  ON feed_items FOR SELECT
  TO authenticated
  USING (
    audience_type = 'public'
    OR (
      audience_type = 'club'
      AND EXISTS (
        SELECT 1 FROM user_clubs
        WHERE user_clubs.club_id = feed_items.club_id
        AND user_clubs.user_id = (select auth.uid())
      )
    )
    OR (
      audience_type = 'circle'
      AND EXISTS (
        SELECT 1 FROM circle_members
        WHERE circle_members.circle_id = feed_items.audience_id
        AND circle_members.user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can create feed items" ON feed_items;
CREATE POLICY "Users can create feed items"
  ON feed_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update feed items" ON feed_items;
CREATE POLICY "Authors can update feed items"
  ON feed_items FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can delete feed items" ON feed_items;
CREATE POLICY "Authors can delete feed items"
  ON feed_items FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can add reactions" ON feed_reactions;
CREATE POLICY "Users can add reactions"
  ON feed_reactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON feed_reactions;
CREATE POLICY "Users can remove own reactions"
  ON feed_reactions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can add comments" ON feed_comments;
CREATE POLICY "Users can add comments"
  ON feed_comments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON feed_comments;
CREATE POLICY "Users can update own comments"
  ON feed_comments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON feed_comments;
CREATE POLICY "Users can delete own comments"
  ON feed_comments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own availability" ON availability;
CREATE POLICY "Users can manage own availability"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own availability" ON availability;
CREATE POLICY "Users can update own availability"
  ON availability FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own availability" ON availability;
CREATE POLICY "Users can delete own availability"
  ON availability FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own swipes" ON swipe_matches;
CREATE POLICY "Users can view own swipes"
  ON swipe_matches FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = target_user_id);

DROP POLICY IF EXISTS "Users can create swipes" ON swipe_matches;
CREATE POLICY "Users can create swipes"
  ON swipe_matches FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

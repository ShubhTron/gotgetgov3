-- Migration: 050_broadcast_swipe_notifications
-- Description: Add realtime broadcast for swipe notifications
-- Feature: swipe-right-notifications
-- Task: 6.2 Verify notification appears in UI via realtime subscription
-- Requirements: 8.2, 8.3
--
-- This migration adds a broadcast mechanism to push swipe notifications
-- to users in real-time without requiring page refresh. Similar to the
-- message broadcast pattern (migration 045), this uses realtime.send()
-- to deliver notifications via WebSocket channels.

-- ── Step 1: Update trigger function to broadcast notifications ───────────────

CREATE OR REPLACE FUNCTION create_swipe_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  swiper_name text;
  sport_display text;
  notification_record RECORD;
BEGIN
  -- Only create notifications for right swipes
  IF NEW.direction != 'right' THEN
    RETURN NEW;
  END IF;

  -- Check for existing unread notification from same swiper for same sport
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = NEW.target_user_id
      AND type = 'swipe_right_received'
      AND read = false
      AND (data->>'swiper_id')::uuid = NEW.user_id
      AND data->>'sport' = NEW.sport::text
  ) THEN
    RETURN NEW;
  END IF;

  -- Get swiper's name (with fallback)
  SELECT full_name INTO swiper_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  IF swiper_name IS NULL OR swiper_name = '' THEN
    swiper_name := 'Someone';
  END IF;

  -- Format sport name for display
  sport_display := REPLACE(NEW.sport::text, '_', ' ');
  sport_display := INITCAP(sport_display);

  -- Create notification and capture the inserted record
  INSERT INTO notifications (
    user_id,
    type,
    title,
    body,
    data,
    read
  )
  VALUES (
    NEW.target_user_id,
    'swipe_right_received',
    swiper_name || ' swiped right on you',
    'Interested in playing ' || sport_display,
    jsonb_build_object(
      'swiper_id', NEW.user_id,
      'sport', NEW.sport::text
    ),
    false
  )
  RETURNING * INTO notification_record;

  -- Broadcast notification to user's personal notification channel
  -- User subscribed to user-notifications:{userId} will receive this in real-time
  PERFORM realtime.send(
    jsonb_build_object(
      'id',         notification_record.id,
      'user_id',    notification_record.user_id,
      'type',       notification_record.type,
      'title',      notification_record.title,
      'body',       notification_record.body,
      'data',       notification_record.data,
      'read',       notification_record.read,
      'created_at', notification_record.created_at
    ),
    'notification',
    'user-notifications:' || NEW.target_user_id::text,
    true  -- private: RLS enforces user can only subscribe to their own channel
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_swipe_notification() IS 
  'Automatically creates a notification when a user receives a right swipe and broadcasts it via realtime channel. Prevents duplicates for the same swiper-target-sport combination and handles missing profile data gracefully.';

-- ── Step 2: RLS for notification broadcast channel ───────────────────────────

-- Users can only subscribe to their own notification channel
DROP POLICY IF EXISTS "Users can receive their own notification broadcasts" ON realtime.messages;
CREATE POLICY "Users can receive their own notification broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND 'user-notifications:' || auth.uid()::text = (SELECT realtime.topic())
);

COMMENT ON POLICY "Users can receive their own notification broadcasts" ON realtime.messages IS
  'Allows users to subscribe to their personal notification broadcast channel (user-notifications:{userId}). Used for real-time swipe notification delivery.';

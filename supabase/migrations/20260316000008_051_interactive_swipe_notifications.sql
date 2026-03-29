-- Migration: 051_interactive_swipe_notifications
-- Description: Enhance swipe notifications with interactive connection state
-- Feature: interactive-swipe-connection-notifications
-- Task: 1 - Database migration for interactive notifications
-- Requirements: 1.1, 7.1, 8.1, 8.2, 11.1
--
-- Adds target_user_id and connection_state fields to notification data so the
-- frontend can render interactive Accept/Reject buttons and track state changes.

-- ── Step 1: Replace trigger function with interactive version ─────────────────

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

  -- Check for existing notification from same swiper for same sport that is
  -- still pending or already accepted. Allow a new notification only if the
  -- previous one was rejected/deleted (i.e. no matching row exists with those states).
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = NEW.target_user_id
      AND type = 'swipe_right_received'
      AND (data->>'swiper_id')::uuid = NEW.user_id
      AND data->>'sport' = NEW.sport::text
      AND data->>'connection_state' IN ('pending', 'accepted')
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

  -- Validate required fields are present
  IF NEW.user_id IS NULL OR NEW.target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification with full interactive data and capture the inserted record
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
    'Interested in playing ' || sport_display || '. Do you want to connect?',
    jsonb_build_object(
      'swiper_id',        NEW.user_id,
      'target_user_id',   NEW.target_user_id,
      'sport',            NEW.sport::text,
      'connection_state', 'pending'
    ),
    false
  )
  RETURNING * INTO notification_record;

  -- Broadcast notification to user's personal notification channel
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
  'Creates an interactive swipe notification with connection_state tracking. Broadcasts via realtime. Prevents duplicates for pending/accepted states; allows a new notification after rejection.';

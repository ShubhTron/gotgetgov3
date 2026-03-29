-- Migration: 048_create_swipe_notification_trigger
-- Description: Create trigger function to automatically create notifications for right swipes
-- Feature: swipe-right-notifications
-- Task: 1.2 Implement create_swipe_notification() trigger function
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3

-- Create the trigger function
CREATE OR REPLACE FUNCTION create_swipe_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  swiper_name text;
  sport_display text;
BEGIN
  -- Only create notifications for right swipes
  IF NEW.direction != 'right' THEN
    RETURN NEW;
  END IF;

  -- Check for existing unread notification from same swiper for same sport
  -- This prevents duplicate notifications for the same swiper-target-sport combination
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

  -- Get swiper's name (with fallback to "Someone" if missing)
  SELECT full_name INTO swiper_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  IF swiper_name IS NULL OR swiper_name = '' THEN
    swiper_name := 'Someone';
  END IF;

  -- Format sport name for display (replace underscores with spaces and capitalize)
  sport_display := REPLACE(NEW.sport::text, '_', ' ');
  sport_display := INITCAP(sport_display);

  -- Create notification with complete data structure
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
  );

  RETURN NEW;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION create_swipe_notification() IS 
  'Automatically creates a notification when a user receives a right swipe. Prevents duplicates for the same swiper-target-sport combination and handles missing profile data gracefully.';

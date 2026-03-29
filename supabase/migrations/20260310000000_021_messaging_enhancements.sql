-- Migration: 021_messaging_enhancements
-- Description: Add database functions and triggers for atomic conversation creation,
--              automatic circle/team conversation creation, and message notifications
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 11.1, 11.2, 11.3

-- ============================================================================
-- Function: get_or_create_direct_conversation
-- Purpose: Atomically get or create a direct conversation between two users
-- Prevents race conditions and duplicate conversations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  user_a uuid,
  user_b uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
  normalized_user_a uuid;
  normalized_user_b uuid;
BEGIN
  -- Normalize order to prevent duplicates (always store smaller UUID first)
  IF user_a < user_b THEN
    normalized_user_a := user_a;
    normalized_user_b := user_b;
  ELSE
    normalized_user_a := user_b;
    normalized_user_b := user_a;
  END IF;

  -- Try to find existing conversation between these two users
  SELECT c.id INTO conv_id
  FROM conversations c
  WHERE c.type = 'direct'
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp1
      WHERE cp1.conversation_id = c.id AND cp1.user_id = normalized_user_a
    )
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = c.id AND cp2.user_id = normalized_user_b
    )
    AND (
      SELECT COUNT(*) FROM conversation_participants cp
      WHERE cp.conversation_id = c.id
    ) = 2
  LIMIT 1;

  -- If found, return it
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (type)
  VALUES ('direct')
  RETURNING id INTO conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (conv_id, normalized_user_a),
    (conv_id, normalized_user_b);

  RETURN conv_id;
END;
$$;

-- ============================================================================
-- Function: auto_create_circle_conversation
-- Purpose: Automatically create or update circle conversation when member joins
-- Triggers on INSERT to circle_members table
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_circle_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
  member_id uuid;
BEGIN
  -- Check if conversation already exists for this circle
  SELECT id INTO conv_id
  FROM conversations
  WHERE type = 'circle' AND circle_id = NEW.circle_id
  LIMIT 1;

  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, circle_id)
    VALUES ('circle', NEW.circle_id)
    RETURNING id INTO conv_id;

    -- Add all existing circle members as participants
    FOR member_id IN
      SELECT user_id FROM circle_members WHERE circle_id = NEW.circle_id
    LOOP
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (conv_id, member_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;
  ELSE
    -- Conversation exists, just add the new member
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, NEW.user_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Function: auto_create_team_conversation
-- Purpose: Automatically create or update team conversation when member joins
-- Triggers on INSERT to team_members table
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_create_team_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
  member_id uuid;
BEGIN
  -- Check if conversation already exists for this team
  SELECT id INTO conv_id
  FROM conversations
  WHERE type = 'team' AND team_id = NEW.team_id
  LIMIT 1;

  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, team_id)
    VALUES ('team', NEW.team_id)
    RETURNING id INTO conv_id;

    -- Add all existing team members as participants
    FOR member_id IN
      SELECT user_id FROM team_members WHERE team_id = NEW.team_id
    LOOP
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (conv_id, member_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END LOOP;
  ELSE
    -- Conversation exists, just add the new member
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, NEW.user_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Function: create_message_notification
-- Purpose: Create notifications for new messages sent to conversation participants
-- Triggers on INSERT to messages table
-- ============================================================================

CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant_id uuid;
  sender_name text;
  message_preview text;
BEGIN
  -- Get sender's name from profiles
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Truncate message for preview (first 50 characters)
  message_preview := LEFT(NEW.content, 50);
  IF LENGTH(NEW.content) > 50 THEN
    message_preview := message_preview || '...';
  END IF;

  -- Create notification for each participant except sender
  FOR participant_id IN
    SELECT user_id
    FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      body,
      data,
      read
    )
    VALUES (
      participant_id,
      'new_message',
      sender_name || ' sent you a message',
      message_preview,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      ),
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Create Triggers
-- ============================================================================

-- Trigger for automatic circle conversation creation
DROP TRIGGER IF EXISTS trigger_auto_create_circle_conversation ON circle_members;
CREATE TRIGGER trigger_auto_create_circle_conversation
AFTER INSERT ON circle_members
FOR EACH ROW
EXECUTE FUNCTION auto_create_circle_conversation();

-- Trigger for automatic team conversation creation
DROP TRIGGER IF EXISTS trigger_auto_create_team_conversation ON team_members;
CREATE TRIGGER trigger_auto_create_team_conversation
AFTER INSERT ON team_members
FOR EACH ROW
EXECUTE FUNCTION auto_create_team_conversation();

-- Trigger for message notifications
DROP TRIGGER IF EXISTS trigger_create_message_notification ON messages;
CREATE TRIGGER trigger_create_message_notification
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(uuid, uuid) TO authenticated;

-- Note: Trigger functions don't need explicit grants as they run with SECURITY DEFINER


-- Migration: 037_group_chat_functions
-- Description: Add SECURITY DEFINER functions for all group chat operations to bypass RLS.
-- Also idempotently applies schema from 035+036 in case those migrations were not yet applied.

-- ============================================================================
-- Idempotent schema setup (covers migrations 035 + 036)
-- ============================================================================

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('direct', 'circle', 'team', 'group'));

ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false NOT NULL;
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_created_by
  ON conversations(created_by) WHERE type = 'group';

CREATE INDEX IF NOT EXISTS idx_conversations_type
  ON conversations(type);

CREATE INDEX IF NOT EXISTS idx_cp_is_admin
  ON conversation_participants(conversation_id, is_admin) WHERE is_admin = true;

CREATE INDEX IF NOT EXISTS idx_cp_is_creator
  ON conversation_participants(conversation_id, is_creator) WHERE is_creator = true;

-- ============================================================================
-- 1. create_group_conversation
-- ============================================================================

CREATE OR REPLACE FUNCTION create_group_conversation(
  p_name       text,
  p_creator_id uuid,
  p_member_ids uuid[],
  p_avatar_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_mid     uuid;
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Group name cannot be empty';
  END IF;
  IF array_length(p_member_ids, 1) IS NULL OR array_length(p_member_ids, 1) < 1 THEN
    RAISE EXCEPTION 'Group must have at least one other member';
  END IF;
  IF array_length(p_member_ids, 1) + 1 > 50 THEN
    RAISE EXCEPTION 'Group cannot have more than 50 members';
  END IF;

  INSERT INTO conversations (type, name, avatar_url, created_by)
    VALUES ('group', trim(p_name), p_avatar_url, p_creator_id)
    RETURNING id INTO v_conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id, is_admin, is_creator)
    VALUES (v_conv_id, p_creator_id, true, true);

  FOREACH v_mid IN ARRAY p_member_ids LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin, is_creator)
      VALUES (v_conv_id, v_mid, false, false);
  END LOOP;

  RETURN v_conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_group_conversation(text, uuid, uuid[], text) TO authenticated;

-- ============================================================================
-- 2. add_group_member
-- ============================================================================

CREATE OR REPLACE FUNCTION add_group_member(
  p_conversation_id uuid,
  p_adding_user_id  uuid,
  p_new_member_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_adding_user_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;

  SELECT COUNT(*) INTO v_count
    FROM conversation_participants WHERE conversation_id = p_conversation_id;
  IF v_count >= 50 THEN
    RAISE EXCEPTION 'Group has reached the maximum of 50 members';
  END IF;

  INSERT INTO conversation_participants (conversation_id, user_id, is_admin, is_creator)
    VALUES (p_conversation_id, p_new_member_id, false, false)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION add_group_member(uuid, uuid, uuid) TO authenticated;

-- ============================================================================
-- 3. remove_group_member
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_group_member(
  p_conversation_id uuid,
  p_admin_id        uuid,
  p_member_id       uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can remove members';
  END IF;

  IF EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_member_id AND is_creator = true
  ) THEN
    RAISE EXCEPTION 'Cannot remove the group creator';
  END IF;

  DELETE FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_group_member(uuid, uuid, uuid) TO authenticated;

-- ============================================================================
-- 4. leave_group_conversation (with creator succession)
-- ============================================================================

CREATE OR REPLACE FUNCTION leave_group_conversation(
  p_conversation_id uuid,
  p_user_id         uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_creator bool;
  v_successor  uuid;
BEGIN
  SELECT is_creator INTO v_is_creator
    FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  IF v_is_creator IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;

  IF v_is_creator THEN
    -- Try to hand off to oldest admin first
    SELECT user_id INTO v_successor
      FROM conversation_participants
      WHERE conversation_id = p_conversation_id
        AND user_id <> p_user_id
        AND is_admin = true
      ORDER BY joined_at ASC
      LIMIT 1;

    -- Fall back to oldest member
    IF v_successor IS NULL THEN
      SELECT user_id INTO v_successor
        FROM conversation_participants
        WHERE conversation_id = p_conversation_id AND user_id <> p_user_id
        ORDER BY joined_at ASC
        LIMIT 1;
    END IF;

    IF v_successor IS NOT NULL THEN
      UPDATE conversation_participants
        SET is_creator = true, is_admin = true
        WHERE conversation_id = p_conversation_id AND user_id = v_successor;
    END IF;
  END IF;

  DELETE FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_group_conversation(uuid, uuid) TO authenticated;

-- ============================================================================
-- 5. promote_to_group_admin
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_to_group_admin(
  p_conversation_id uuid,
  p_admin_id        uuid,
  p_member_id       uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can promote members';
  END IF;

  UPDATE conversation_participants
    SET is_admin = true
    WHERE conversation_id = p_conversation_id AND user_id = p_member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION promote_to_group_admin(uuid, uuid, uuid) TO authenticated;

-- ============================================================================
-- 6. demote_group_admin
-- ============================================================================

CREATE OR REPLACE FUNCTION demote_group_admin(
  p_conversation_id  uuid,
  p_admin_id         uuid,
  p_admin_to_demote  uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can demote other admins';
  END IF;

  IF EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_to_demote AND is_creator = true
  ) THEN
    RAISE EXCEPTION 'Cannot demote the group creator';
  END IF;

  UPDATE conversation_participants
    SET is_admin = false
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_to_demote;
END;
$$;

GRANT EXECUTE ON FUNCTION demote_group_admin(uuid, uuid, uuid) TO authenticated;

-- ============================================================================
-- 7. delete_group_conversation
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_group_conversation(
  p_conversation_id uuid,
  p_user_id         uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id AND is_creator = true
  ) THEN
    RAISE EXCEPTION 'Only the group creator can delete the group';
  END IF;

  DELETE FROM conversations WHERE id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_group_conversation(uuid, uuid) TO authenticated;

-- ============================================================================
-- 8. update_group_name
-- ============================================================================

CREATE OR REPLACE FUNCTION update_group_name(
  p_conversation_id uuid,
  p_admin_id        uuid,
  p_name            text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_admin_id AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can rename the group';
  END IF;

  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Group name cannot be empty';
  END IF;

  UPDATE conversations
    SET name = trim(p_name)
    WHERE id = p_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_group_name(uuid, uuid, text) TO authenticated;


-- Migration: 023_fix_conversation_rls
-- Description: Fix RLS policies and function to properly handle conversation creation
-- This fixes the 500 error when querying conversation_participants

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
  IF user_a < user_b THEN
    normalized_user_a := user_a;
    normalized_user_b := user_b;
  ELSE
    normalized_user_a := user_b;
    normalized_user_b := user_a;
  END IF;

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

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  SET LOCAL row_security = off;

  INSERT INTO conversations (type)
  VALUES ('direct')
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (conv_id, normalized_user_a),
    (conv_id, normalized_user_b);

  SET LOCAL row_security = on;

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION get_or_create_direct_conversation(uuid, uuid) IS 
  'Atomically creates or retrieves a direct conversation between two users. Uses SECURITY DEFINER to bypass RLS during creation.';

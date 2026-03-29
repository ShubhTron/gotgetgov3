-- Migration: Add update_channel_details function
-- Description: Function to update broadcast channel name and avatar
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5

-- ============================================================================
-- update_channel_details
-- ============================================================================

CREATE OR REPLACE FUNCTION update_channel_details(
  p_conversation_id uuid,
  p_admin_id        uuid,
  p_name            text DEFAULT NULL,
  p_avatar_url      text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin has is_admin=true
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id 
      AND user_id = p_admin_id 
      AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can edit channel details';
  END IF;

  -- Validate name if provided (min 1 character)
  IF p_name IS NOT NULL AND trim(p_name) = '' THEN
    RAISE EXCEPTION 'Channel name must be at least 1 character';
  END IF;

  -- Update conversation record (name, avatar_url)
  UPDATE conversations
  SET 
    name = COALESCE(NULLIF(trim(p_name), ''), name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = p_conversation_id
    AND type = 'broadcast';

  -- Note: Notifications to subscribers will be handled by the application layer
END;
$$;

GRANT EXECUTE ON FUNCTION update_channel_details(uuid, uuid, text, text) TO authenticated;

COMMENT ON FUNCTION update_channel_details IS 
  'Updates broadcast channel name and/or avatar. Only admins can update channel details.';

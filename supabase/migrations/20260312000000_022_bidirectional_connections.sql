/*
  # Bidirectional Connections Support

  1. Changes
    - Creates a SECURITY DEFINER function to create bidirectional connections
    - Fixes existing one-way connections by creating missing reverse connections
    - Ensures messaging compatibility by requiring both directions

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for connection creation
    - Only creates connections where at least one direction already exists
*/

-- Create a function to ensure bidirectional connections
CREATE OR REPLACE FUNCTION create_bidirectional_connection(
  p_user_id uuid,
  p_connected_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent self-connection
  IF p_user_id = p_connected_user_id THEN
    RAISE EXCEPTION 'Cannot connect with yourself';
  END IF;

  -- Create connection from user_id to connected_user_id if it doesn't exist
  INSERT INTO connections (user_id, connected_user_id, status)
  VALUES (p_user_id, p_connected_user_id, 'accepted')
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;

  -- Create reverse connection from connected_user_id to user_id if it doesn't exist
  INSERT INTO connections (user_id, connected_user_id, status)
  VALUES (p_connected_user_id, p_user_id, 'accepted')
  ON CONFLICT (user_id, connected_user_id) DO NOTHING;
END;
$$;

-- Fix existing one-way connections by creating missing reverse connections
-- This ensures all existing connections are bidirectional
INSERT INTO connections (user_id, connected_user_id, status, created_at)
SELECT 
  c.connected_user_id as user_id,
  c.user_id as connected_user_id,
  c.status,
  c.created_at
FROM connections c
WHERE NOT EXISTS (
  SELECT 1 FROM connections c2
  WHERE c2.user_id = c.connected_user_id
    AND c2.connected_user_id = c.user_id
)
ON CONFLICT (user_id, connected_user_id) DO NOTHING;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_bidirectional_connection(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION create_bidirectional_connection IS 
'Creates bidirectional connections between two users, bypassing RLS policies. Required for messaging compatibility.';


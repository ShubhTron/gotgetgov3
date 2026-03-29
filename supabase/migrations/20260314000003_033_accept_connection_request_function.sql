-- Migration: Accept Connection Request Function
-- Description: Creates a SECURITY DEFINER function to atomically accept connection requests
-- This ensures all operations (status update, connection creation, notification) happen atomically

-- Create function to accept connection request atomically
CREATE OR REPLACE FUNCTION accept_connection_request(
  p_request_id uuid,
  p_status_changed_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_id uuid;
  v_recipient_id uuid;
  v_current_status text;
  v_connection_id uuid;
BEGIN
  -- Get request details and lock the row
  SELECT requester_id, recipient_id, status
  INTO v_requester_id, v_recipient_id, v_current_status
  FROM connection_requests
  WHERE id = p_request_id
  FOR UPDATE;

  -- Verify request exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection request not found';
  END IF;

  -- Verify request is in pending status
  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Cannot accept request in % status', v_current_status;
  END IF;

  -- Update request status to 'accepted'
  UPDATE connection_requests
  SET 
    status = 'accepted',
    status_changed_at = p_status_changed_at,
    updated_at = now()
  WHERE id = p_request_id;

  -- Create bidirectional connections using existing function
  PERFORM create_bidirectional_connection(v_requester_id, v_recipient_id);

  -- Get the connection ID (from requester to recipient)
  SELECT id INTO v_connection_id
  FROM connections
  WHERE user_id = v_requester_id
    AND connected_user_id = v_recipient_id
  LIMIT 1;

  -- Return the connection ID
  RETURN v_connection_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION accept_connection_request(uuid, timestamptz) TO authenticated;

-- Add comment
COMMENT ON FUNCTION accept_connection_request IS 
'Atomically accepts a connection request by updating status and creating bidirectional connections. Uses SECURITY DEFINER to bypass RLS policies.';


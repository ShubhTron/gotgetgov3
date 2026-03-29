-- Migration: Add RLS policies for connection_requests table
-- Description: Implements row-level security for connection requests
-- Requirements: 1.1, 3.1, 4.1, 6.1

-- Enable RLS on connection_requests table
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert requests where they are the requester
-- Validates: Requirement 1.1 (Create Connection Request)
CREATE POLICY "Users can insert their own connection requests"
  ON connection_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

-- Policy: Users can view requests where they are requester or recipient
-- Validates: Requirements 1.1, 3.1, 4.1, 6.1 (View own requests)
CREATE POLICY "Users can view their connection requests"
  ON connection_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = recipient_id
  );

-- Policy: Users can update requests where they are the recipient (accept/reject) or requester (cancel)
-- Validates: Requirements 3.1 (Accept), 4.1 (Reject), 6.1 (Cancel)
CREATE POLICY "Users can update connection requests they're involved in"
  ON connection_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = recipient_id OR 
    auth.uid() = requester_id
  )
  WITH CHECK (
    auth.uid() = recipient_id OR 
    auth.uid() = requester_id
  );

-- Add helpful comments
COMMENT ON POLICY "Users can insert their own connection requests" ON connection_requests IS 
  'Allows users to create connection requests where they are the requester';

COMMENT ON POLICY "Users can view their connection requests" ON connection_requests IS 
  'Allows users to view connection requests where they are either the requester or recipient';

COMMENT ON POLICY "Users can update connection requests they're involved in" ON connection_requests IS 
  'Allows recipients to accept/reject requests and requesters to cancel their own requests';


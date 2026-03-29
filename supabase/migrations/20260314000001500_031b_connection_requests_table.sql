-- Migration: Create connection_requests table
-- Description: Implements LinkedIn-style connection request system with pending/accepted/rejected states
-- Requirements: 8.1, 8.2, 8.4, 8.5

-- Add new notification types for connection requests
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_request_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_request_accepted';

-- Create connection_requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status_changed_at timestamptz,
  
  -- Constraints
  CONSTRAINT connection_requests_unique_pair UNIQUE(requester_id, recipient_id),
  CONSTRAINT connection_requests_no_self_request CHECK (requester_id != recipient_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient 
  ON connection_requests(recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_connection_requests_requester 
  ON connection_requests(requester_id, status);

CREATE INDEX IF NOT EXISTS idx_connection_requests_status_changed 
  ON connection_requests(status, status_changed_at);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_connection_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER connection_requests_updated_at
  BEFORE UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_requests_updated_at();

-- Add helpful comments
COMMENT ON TABLE connection_requests IS 'Stores connection requests between users with pending/accepted/rejected/cancelled states';
COMMENT ON COLUMN connection_requests.requester_id IS 'User who initiated the connection request';
COMMENT ON COLUMN connection_requests.recipient_id IS 'User who received the connection request';
COMMENT ON COLUMN connection_requests.status IS 'Current status: pending, accepted, rejected, or cancelled';
COMMENT ON COLUMN connection_requests.status_changed_at IS 'Timestamp when status changed from pending to terminal state';


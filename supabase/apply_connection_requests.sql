-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR (safe to run multiple times)
-- https://supabase.com/dashboard/project/cikxnlnqvalsxfiwtajo/sql/new
-- ============================================================

-- ── Step 1: Add enum values for connection notifications ──────
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_request_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'connection_request_accepted';

-- ── Step 2: Create connection_requests table ──────────────────
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status_changed_at timestamptz,
  CONSTRAINT connection_requests_unique_pair UNIQUE(requester_id, recipient_id),
  CONSTRAINT connection_requests_no_self_request CHECK (requester_id != recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient
  ON connection_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester
  ON connection_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status_changed
  ON connection_requests(status, status_changed_at);

CREATE OR REPLACE FUNCTION update_connection_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS connection_requests_updated_at ON connection_requests;
CREATE TRIGGER connection_requests_updated_at
  BEFORE UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_requests_updated_at();

-- ── Step 3: RLS policies for connection_requests ──────────────
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own connection requests" ON connection_requests;
CREATE POLICY "Users can insert their own connection requests"
  ON connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can view their connection requests" ON connection_requests;
CREATE POLICY "Users can view their connection requests"
  ON connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can update connection requests they're involved in" ON connection_requests;
CREATE POLICY "Users can update connection requests they're involved in"
  ON connection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = recipient_id OR auth.uid() = requester_id);

-- ── Step 4: accept_connection_request function ────────────────
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
  SELECT requester_id, recipient_id, status
  INTO v_requester_id, v_recipient_id, v_current_status
  FROM connection_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Connection request not found';
  END IF;

  IF v_current_status != 'pending' THEN
    RAISE EXCEPTION 'Cannot accept request in % status', v_current_status;
  END IF;

  UPDATE connection_requests
  SET status = 'accepted', status_changed_at = p_status_changed_at, updated_at = now()
  WHERE id = p_request_id;

  PERFORM create_bidirectional_connection(v_requester_id, v_recipient_id);

  SELECT id INTO v_connection_id
  FROM connections
  WHERE user_id = v_requester_id AND connected_user_id = v_recipient_id
  LIMIT 1;

  RETURN v_connection_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_connection_request(uuid, timestamptz) TO authenticated;

-- ── Step 5: REMOVED ──
-- DO NOT add notifications or connection_requests to supabase_realtime publication.
-- These high-churn tables cause 100k+ WAL reads (realtime.list_changes calls),
-- leading to CPU exhaustion and slow app load times. See migration 043.
-- Notification badges update on page visibility change instead.
-- Connection request status updates on navigation instead.

-- ── Step 6: Reload PostgREST schema cache ─────────────────────
-- Critical: after ALTER TYPE ADD VALUE, PostgREST still uses the
-- old cached enum. Without this, the notification INSERT fails
-- silently with a type error and no notifications are ever saved.
NOTIFY pgrst, 'reload schema';

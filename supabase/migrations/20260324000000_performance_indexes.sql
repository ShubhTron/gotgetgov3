-- ============================================================
-- Performance Indexes — GotGetGo v3
-- Run this in Supabase SQL Editor → "Run"
-- ============================================================

-- ── messages ─────────────────────────────────────────────────
-- Most critical: used to find last message per conversation
-- and count unread messages. Without this index every
-- conversation list load does a full table scan per conversation.

CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc
  ON messages (conversation_id, created_at DESC);

-- Used for unread-count queries (.neq sender_id filter)
CREATE INDEX IF NOT EXISTS idx_messages_conv_sender_created
  ON messages (conversation_id, sender_id, created_at DESC);

-- ── conversation_participants ─────────────────────────────────
-- Fetched heavily: "get my conversations", "get all participants
-- for these conversations", "mark as read".

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id
  ON conversation_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_conv_participants_conversation_id
  ON conversation_participants (conversation_id);

-- Composite for the common (conversation_id, user_id) filter
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_user
  ON conversation_participants (conversation_id, user_id);

-- ── conversations ─────────────────────────────────────────────
-- UPDATE on conversations is slow (7,605 ms mean in profiler).
-- The primary key index exists but the updated_at sort is missing.

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON conversations (updated_at DESC);

-- ── notifications ─────────────────────────────────────────────
-- Polled on every visibility-change (8,739 calls).
-- Filter: user_id = $1 AND read = false AND type = ANY($2)

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_type
  ON notifications (user_id, read, type)
  WHERE read = false;

-- Fallback for queries that don't filter on read
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications (user_id);

-- ── user_sport_profiles ───────────────────────────────────────
-- Most frequent SELECT (9,354 calls). Queried by user_id
-- (profile page, discover, modal) and by sport+level (discover filter).

CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_user_id
  ON user_sport_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_sport_profiles_sport_level
  ON user_sport_profiles (sport, self_assessed_level);

-- ── profiles ─────────────────────────────────────────────────
-- last_seen is updated frequently (1,180 calls, 2,757 ms mean)
-- and read in the conversations list to show online indicators.

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
  ON profiles (last_seen DESC);

-- Geospatial queries in Discover (haversine distance filter)
CREATE INDEX IF NOT EXISTS idx_profiles_location
  ON profiles (location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- ── swipe_matches ─────────────────────────────────────────────
-- Filtered by (user_id, sport) on every Discover page load.
-- Also used for upsert with ON CONFLICT (user_id, target_user_id, sport).

CREATE INDEX IF NOT EXISTS idx_swipe_matches_user_sport
  ON swipe_matches (user_id, sport);

-- ── connections ───────────────────────────────────────────────
-- checkMutualConnection queries both directions on every
-- conversation create / message send.

CREATE INDEX IF NOT EXISTS idx_connections_user_connected
  ON connections (user_id, connected_user_id);

CREATE INDEX IF NOT EXISTS idx_connections_connected_user
  ON connections (connected_user_id, user_id);

-- ── favorites ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_favorites_user_id
  ON favorites (user_id);

-- ── connection_requests ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_connection_requests_recipient_status
  ON connection_requests (recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_connection_requests_requester_status
  ON connection_requests (requester_id, status);

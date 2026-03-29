-- Migration: 043_clean_realtime_publication
-- Description: Ensure only 'messages' is in the supabase_realtime publication.
-- Background: An unfiltered postgres_changes subscription on the messages table
-- combined with high-churn tables in the publication caused 100k+ WAL reads
-- (realtime.list_changes calls), leading to slow app load and CPU exhaustion.
--
-- Only 'messages' should be in the publication. All other tables use either:
--   - Broadcast channels (WebSocket-only, no WAL reads)
--   - On-demand fetches on user navigation
--
-- This migration guards against accidental re-addition of tables.

-- Remove notifications if accidentally added (e.g. by apply_connection_requests.sql)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
    RAISE NOTICE 'Removed notifications from supabase_realtime publication';
  END IF;
END $$;

-- Remove connection_requests if accidentally added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'connection_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE connection_requests;
    RAISE NOTICE 'Removed connection_requests from supabase_realtime publication';
  END IF;
END $$;

-- Remove stories if accidentally added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'stories'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE stories;
    RAISE NOTICE 'Removed stories from supabase_realtime publication';
  END IF;
END $$;

-- Remove conversation_participants if accidentally added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE conversation_participants;
    RAISE NOTICE 'Removed conversation_participants from supabase_realtime publication';
  END IF;
END $$;

-- Verify: only messages should remain
-- (This is informational only - will show in migration log)
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'supabase_realtime publication contains: %', tbl.tablename;
  END LOOP;
END $$;

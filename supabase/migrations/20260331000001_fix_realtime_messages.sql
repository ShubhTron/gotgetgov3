-- Migration: Fix realtime message reception
-- Add messages table back to realtime publication for postgres_changes subscriptions
-- This is more reliable than broadcast channels across all Supabase versions

-- Add messages table to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Added messages to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'messages table already in supabase_realtime publication';
  END IF;
END $$;

-- Verify the table is in the publication
SELECT 
  pubname,
  tablename,
  schemaname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

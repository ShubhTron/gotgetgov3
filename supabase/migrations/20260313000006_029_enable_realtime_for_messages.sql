-- Enable Realtime for messages table only.
-- conversation_participants is intentionally excluded: read-receipt UPDATE events
-- would flood the WAL reader and cause CPU exhaustion on the free tier.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;


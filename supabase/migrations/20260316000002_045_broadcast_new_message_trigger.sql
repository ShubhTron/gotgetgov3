-- Migration: 045_broadcast_new_message_trigger
-- Replace postgres_changes subscriptions on messages with DB-triggered broadcast.
--
-- Problem: Every subscribeToConversation() call creates a postgres_changes
-- subscription which forces Supabase to call realtime.list_changes() on EVERY
-- messages INSERT — even with a conversation_id filter. With 2 users and multiple
-- open chats, this produced 3000+ WAL reads per interval.
--
-- Solution: A trigger on messages INSERT calls realtime.send() to push directly
-- to two broadcast channels (pure WebSocket, zero WAL reads):
--   1. messages:{conversationId} — for open ChatView instances
--   2. user-messages:{userId}    — for each participant's badge/list updates
--
-- After this migration, messages is removed from supabase_realtime publication.

-- ── Step 1: Trigger function ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.broadcast_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participant RECORD;
BEGIN
  -- Broadcast full message payload to the conversation channel.
  -- Open ChatView instances subscribed to messages:{conversationId} receive this.
  PERFORM realtime.send(
    jsonb_build_object(
      'id',              NEW.id,
      'conversation_id', NEW.conversation_id,
      'sender_id',       NEW.sender_id,
      'content',         NEW.content,
      'created_at',      NEW.created_at
    ),
    'new-message',
    'messages:' || NEW.conversation_id::text,
    true  -- private: RLS on realtime.messages enforces participant check
  );

  -- Broadcast a lightweight notification to each participant's personal inbox.
  -- AppShell/ConversationList subscribed to user-messages:{userId} use this
  -- for badge counts and list refresh — works even when ChatView is not open.
  FOR participant IN
    SELECT user_id
    FROM   conversation_participants
    WHERE  conversation_id = NEW.conversation_id
      AND  user_id         != NEW.sender_id
  LOOP
    PERFORM realtime.send(
      jsonb_build_object('conversation_id', NEW.conversation_id),
      'new-message',
      'user-messages:' || participant.user_id::text,
      true  -- private
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_broadcast_new_message ON public.messages;
CREATE TRIGGER trg_broadcast_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_new_message();

-- ── Step 2: RLS for new broadcast channel topics ──────────────────────────────

-- Users can subscribe to a conversation channel if they are a participant.
DROP POLICY IF EXISTS "Users can receive new message broadcasts" ON realtime.messages;
CREATE POLICY "Users can receive new message broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND EXISTS (
    SELECT 1
    FROM   public.conversation_participants cp
    WHERE  cp.user_id          = auth.uid()
      AND  'messages:' || cp.conversation_id::text = (SELECT realtime.topic())
  )
);

-- Users can only subscribe to their own personal inbox channel.
DROP POLICY IF EXISTS "Users can receive their own inbox broadcasts" ON realtime.messages;
CREATE POLICY "Users can receive their own inbox broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND 'user-messages:' || auth.uid()::text = (SELECT realtime.topic())
);

-- ── Step 3: Remove messages from WAL publication ─────────────────────────────
-- All message delivery is now handled by the broadcast trigger.
-- There are no more postgres_changes subscriptions for messages,
-- so keeping it in the publication only adds unnecessary WAL overhead.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE messages;
    RAISE NOTICE 'Removed messages from supabase_realtime publication';
  END IF;
END $$;

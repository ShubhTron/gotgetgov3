-- Migration: notifications broadcast trigger
-- Replaces the INSERT-only Postgres Changes subscription + 60s poll with a DB trigger
-- that calls realtime.broadcast_changes() on INSERT or UPDATE.
-- The notifications table is intentionally NOT added to the supabase_realtime publication
-- (see migration 034) — this trigger approach avoids WAL publication overhead entirely.

-- 1. Trigger function: broadcasts any INSERT or UPDATE on the notifications table
--    to the private channel 'notifications:{userId}' via realtime.broadcast_changes().
CREATE OR REPLACE FUNCTION notify_notification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'notifications:' || NEW.user_id,  -- topic: private channel per user
    TG_OP,                             -- event name (INSERT or UPDATE)
    TG_OP,                             -- operation
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NEW;
END;
$$;

-- 2. Trigger: fires AFTER INSERT OR UPDATE on notifications, once per row.
CREATE TRIGGER on_notification_change
  AFTER INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_notification_change();

-- 3. RLS policy on realtime.messages: allows authenticated users to receive
--    broadcasts only on their own notification channel.
--    Required for private broadcast channels (Supabase Realtime Authorization).
CREATE POLICY "Users can receive their own notification broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (realtime.topic() = 'notifications:' || auth.uid()::text);

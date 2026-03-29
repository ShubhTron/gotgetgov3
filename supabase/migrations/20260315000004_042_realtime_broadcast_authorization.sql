-- Migration: 042_realtime_broadcast_authorization
-- Description: Set up RLS for Supabase Realtime Broadcast channels
-- This enables private broadcast channels with proper authorization

-- ============================================================================
-- Enable RLS on realtime.messages table (used by Broadcast)
-- ============================================================================

-- Note: The realtime.messages table is managed by Supabase
-- We just need to add RLS policies for authorization

-- Drop existing policies if they exist (in case of re-run)
DROP POLICY IF EXISTS "Users can receive broadcasts from their channels" ON "realtime"."messages";
DROP POLICY IF EXISTS "Admins can send broadcasts to their channels" ON "realtime"."messages";

-- Create policy to allow users to receive broadcasts from channels they're subscribed to
CREATE POLICY "Users can receive broadcasts from their channels"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (
  -- Check if user is a participant in the conversation
  -- The topic format is "broadcast:{channel_id}"
  -- realtime.topic() returns the current channel topic
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.user_id = auth.uid()
      AND 'broadcast:' || cp.conversation_id::text = (SELECT realtime.topic())
      AND realtime.messages.extension = 'broadcast'
  )
);

-- Create policy to allow admins to send broadcasts
CREATE POLICY "Admins can send broadcasts to their channels"
ON "realtime"."messages"
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if user is an admin of the conversation
  -- The topic format is "broadcast:{channel_id}"
  EXISTS (
    SELECT 1
    FROM conversation_participants cp
    WHERE cp.user_id = auth.uid()
      AND cp.is_admin = true
      AND 'broadcast:' || cp.conversation_id::text = (SELECT realtime.topic())
      AND realtime.messages.extension = 'broadcast'
  )
);

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Users can receive broadcasts from their channels" ON "realtime"."messages" IS 
  'Allows users to receive broadcast messages from channels they are subscribed to. Uses private channel authorization.';

COMMENT ON POLICY "Admins can send broadcasts to their channels" ON "realtime"."messages" IS 
  'Allows channel admins to send broadcast messages. Only admins can send, subscribers can only receive.';

-- ============================================================================
-- Fix the conversations INSERT policy (if not already fixed)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Allow authenticated conversation creation" ON conversations;

-- Create clean INSERT policy
CREATE POLICY "Authenticated users can create conversations"
  ON conversations 
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "Authenticated users can create conversations" ON conversations IS 
  'Allows authenticated users to create conversations. Validation is handled by application logic.';

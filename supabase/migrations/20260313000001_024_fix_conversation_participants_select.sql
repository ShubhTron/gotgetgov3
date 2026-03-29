-- Migration: 024_fix_conversation_participants_select
-- Description: Fix RLS policy for conversation_participants SELECT to allow users to query their own participations
-- This fixes the 500 error when fetching conversations

-- ============================================================================
-- Drop and recreate the SELECT policy for conversation_participants
-- ============================================================================

-- Drop the existing policy
DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;

-- Create a simpler, more permissive SELECT policy
-- Users can see conversation_participants records where they are a participant in that conversation
CREATE POLICY "Users can view their conversation participations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- Allow if the user is querying their own participation record
    auth.uid() = user_id
    OR
    -- Allow if the user is a participant in the same conversation
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Also ensure the conversations SELECT policy is correct
-- ============================================================================

-- Drop and recreate the SELECT policy for conversations
DROP POLICY IF EXISTS "Conversation participants can view conversations" ON conversations;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Users can view their conversation participations" ON conversation_participants IS 
  'Allows users to view conversation_participants records for conversations they are part of';

COMMENT ON POLICY "Users can view their conversations" ON conversations IS 
  'Allows users to view conversations where they are a participant';


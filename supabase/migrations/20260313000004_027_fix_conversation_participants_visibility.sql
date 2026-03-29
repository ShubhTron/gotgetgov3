-- Migration: 027_fix_conversation_participants_visibility
-- Description: Allow users to see ALL participants in conversations they're part of
-- This fixes the "Unknown" name issue by allowing users to see other participants' info

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own participations" ON conversation_participants;

-- Create a new policy that allows users to see all participants in their conversations
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- User can see all participants in conversations where they are also a participant
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Add helpful comment
COMMENT ON POLICY "Users can view participants in their conversations" ON conversation_participants IS 
  'Allows users to see all participants (including other users) in conversations they are part of. This is necessary to display conversation names and participant lists.';


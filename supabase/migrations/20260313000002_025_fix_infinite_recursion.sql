-- Migration: 025_fix_infinite_recursion
-- Description: Fix infinite recursion in RLS policies by using simpler, non-recursive policies
-- This fixes the 500 error caused by recursive policy checks

-- ============================================================================
-- Fix conversation_participants policies (remove recursion)
-- ============================================================================

-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participations" ON conversation_participants;
DROP POLICY IF EXISTS "Participants can add to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Allow participant insertion" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON conversation_participants;

-- Create simple, non-recursive SELECT policy
-- Users can only see their own participation records
CREATE POLICY "Users can view own participations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow INSERT for authenticated users (SECURITY DEFINER functions will handle validation)
CREATE POLICY "Allow authenticated insert"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own records (for last_read_at)
CREATE POLICY "Users can update own participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own participation (leave conversation)
CREATE POLICY "Users can delete own participation"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Fix conversations policies (remove recursion)
-- ============================================================================

-- Drop all existing policies on conversations
DROP POLICY IF EXISTS "Conversation participants can view conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Allow conversation creation" ON conversations;

-- Create simple SELECT policy using a subquery that won't recurse
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Allow INSERT for authenticated users (SECURITY DEFINER functions will handle validation)
CREATE POLICY "Allow authenticated conversation creation"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- Fix messages policies (ensure they're also non-recursive)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages" ON messages;

-- Users can view messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can send messages to conversations they participate in
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Users can view own participations" ON conversation_participants IS 
  'Simple non-recursive policy: users can only see their own participation records';

COMMENT ON POLICY "Users can view conversations they participate in" ON conversations IS 
  'Non-recursive policy using IN subquery to check participation';

COMMENT ON POLICY "Users can view messages in their conversations" ON messages IS 
  'Non-recursive policy using IN subquery to check participation';


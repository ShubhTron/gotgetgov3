-- Migration: 028_fix_rls_properly
-- Description: Properly fix RLS policies to avoid infinite recursion while allowing users to see all participants
-- This uses a different approach: disable RLS checks within the policy using a security definer function

-- ============================================================================
-- Step 1: Create a helper function that bypasses RLS to check participation
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid);

-- Create a SECURITY DEFINER function that can read conversation_participants without RLS
CREATE OR REPLACE FUNCTION is_conversation_participant(
  p_user_id uuid,
  p_conversation_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE user_id = p_user_id 
      AND conversation_id = p_conversation_id
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_conversation_participant(uuid, uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION is_conversation_participant(uuid, uuid) IS 
  'Security definer function to check if a user is a participant in a conversation without triggering RLS recursion';

-- ============================================================================
-- Step 2: Fix conversation_participants policies using the helper function
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;

-- Create new policy that allows users to see all participants in conversations they're part of
-- This uses the security definer function to avoid recursion
CREATE POLICY "Users can view participants in their conversations v2"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    is_conversation_participant(auth.uid(), conversation_id)
  );

-- Add helpful comment
COMMENT ON POLICY "Users can view participants in their conversations v2" ON conversation_participants IS 
  'Allows users to see all participants in conversations they are part of. Uses security definer function to avoid RLS recursion.';

-- ============================================================================
-- Step 3: Verify other policies are also using the helper function
-- ============================================================================

-- Update conversations policy to use the helper function
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

CREATE POLICY "Users can view conversations they participate in v2"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    is_conversation_participant(auth.uid(), id)
  );

-- Update messages policies to use the helper function
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

CREATE POLICY "Users can view messages in their conversations v2"
  ON messages FOR SELECT
  TO authenticated
  USING (
    is_conversation_participant(auth.uid(), conversation_id)
  );

CREATE POLICY "Users can send messages to their conversations v2"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    is_conversation_participant(auth.uid(), conversation_id)
    AND sender_id = auth.uid()
  );

-- ============================================================================
-- Step 4: Add comments
-- ============================================================================

COMMENT ON POLICY "Users can view conversations they participate in v2" ON conversations IS 
  'Uses security definer function to check participation without RLS recursion';

COMMENT ON POLICY "Users can view messages in their conversations v2" ON messages IS 
  'Uses security definer function to check participation without RLS recursion';

COMMENT ON POLICY "Users can send messages to their conversations v2" ON messages IS 
  'Uses security definer function to check participation without RLS recursion';


-- Migration: 041_add_conversations_insert_policy
-- Description: Add missing INSERT policy for conversations table
-- This was accidentally dropped in migration 028_fix_rls_properly.sql

-- ============================================================================
-- Add INSERT policy for conversations table
-- ============================================================================

-- Drop if exists (in case it was manually added)
DROP POLICY IF EXISTS "Allow authenticated conversation creation" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

-- Create INSERT policy that allows authenticated users to create conversations
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON POLICY "Authenticated users can create conversations" ON conversations IS 
  'Allows authenticated users to create conversations. Validation is handled by application logic and SECURITY DEFINER functions.';


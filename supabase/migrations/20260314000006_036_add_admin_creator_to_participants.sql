-- Migration: 036_add_admin_creator_to_participants
-- Description: Add is_admin and is_creator columns to conversation_participants table
-- Requirements: 1.4, 6.1, 10.5

-- ============================================================================
-- Add admin and creator status columns
-- ============================================================================

-- Add is_admin column to track admin status
ALTER TABLE conversation_participants
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false NOT NULL;

-- Add is_creator column to track creator status
ALTER TABLE conversation_participants
ADD COLUMN IF NOT EXISTS is_creator boolean DEFAULT false NOT NULL;

-- ============================================================================
-- Add indexes for performance
-- ============================================================================

-- Index on is_admin for efficient queries on group admins
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_admin
ON conversation_participants(conversation_id, is_admin)
WHERE is_admin = true;

-- Index on is_creator for efficient queries on group creators
CREATE INDEX IF NOT EXISTS idx_conversation_participants_is_creator
ON conversation_participants(conversation_id, is_creator)
WHERE is_creator = true;


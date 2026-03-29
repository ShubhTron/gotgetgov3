-- Migration: 035_add_group_chat_support
-- Description: Extend conversations table to support group chats with name, avatar, and creator
-- Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.4

-- ============================================================================
-- Add columns for group chat support
-- ============================================================================

-- Add name column for group chat names
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS name text;

-- Add avatar_url column for group chat avatars
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add created_by column to track who created the group
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- Update type constraint to include 'group'
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add new constraint with 'group' type included
ALTER TABLE conversations
ADD CONSTRAINT conversations_type_check
CHECK (type IN ('direct', 'circle', 'team', 'group'));

-- ============================================================================
-- Add indexes for performance
-- ============================================================================

-- Index on created_by for efficient queries on groups created by a user
CREATE INDEX IF NOT EXISTS idx_conversations_created_by
ON conversations(created_by)
WHERE type = 'group';

-- Index on type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_conversations_type
ON conversations(type);


-- Migration: Add Broadcast Channel Support
-- Description: Extend conversations table type constraint to include 'broadcast'

-- Drop the existing constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add new constraint with 'broadcast' type included
ALTER TABLE conversations
ADD CONSTRAINT conversations_type_check
CHECK (type IN ('direct', 'circle', 'team', 'group', 'broadcast'));

-- Add comment to document the constraint
COMMENT ON CONSTRAINT conversations_type_check ON conversations IS 
  'Ensures conversation type is one of: direct, circle, team, group, or broadcast';

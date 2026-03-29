-- Migration: 038_add_conversation_pinning
-- Description: Add is_pinned column to conversation_participants so users can pin conversations.
-- No new RLS policy needed — the existing "Users can update own participation" policy
-- (USING auth.uid() = user_id) already covers updates to a user's own participation row.

ALTER TABLE conversation_participants
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cp_is_pinned
  ON conversation_participants(user_id, is_pinned)
  WHERE is_pinned = true;


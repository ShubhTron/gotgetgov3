-- Migration: 026_add_new_message_notification_type
-- Description: Add 'new_message' to notification_type enum
-- This fixes the error when sending messages that trigger notifications

-- Add 'new_message' to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_message';

-- Add helpful comment
COMMENT ON TYPE notification_type IS 
  'Types of notifications: challenge_received, challenge_accepted, challenge_declined, match_result, ladder_position_change, event_invite, circle_invite, team_invite, competition_update, announcement, system, new_message';


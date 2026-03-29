-- Migration: 047_add_swipe_right_notification_type
-- Description: Add 'swipe_right_received' to notification_type enum
-- Feature: swipe-right-notifications
-- Task: 1.1 Create migration to add 'swipe_right_received' notification type
-- Requirements: 1.1, 1.2

-- Add 'swipe_right_received' to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'swipe_right_received';

-- Add helpful comment
COMMENT ON TYPE notification_type IS
  'Types of notifications: challenge_received, challenge_accepted, challenge_declined, match_result, ladder_position_change, event_invite, circle_invite, team_invite, competition_update, announcement, system, new_message, connection_request_received, connection_request_accepted, score_reminder, score_confirmation_request, score_disputed, swipe_right_received';

-- Reload PostgREST schema cache so it recognises the new enum value.
-- Without this, INSERT into notifications with 'swipe_right_received' fails silently.
NOTIFY pgrst, 'reload schema';

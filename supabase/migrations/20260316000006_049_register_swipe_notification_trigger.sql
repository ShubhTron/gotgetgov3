-- Migration: 049_register_swipe_notification_trigger
-- Description: Register AFTER INSERT trigger on swipe_matches table
-- Feature: swipe-right-notifications
-- Task: 1.3 Register trigger on swipe_matches table
-- Requirements: 2.1, 8.1

-- Drop trigger if it already exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_swipe_notification ON swipe_matches;

-- Create AFTER INSERT trigger on swipe_matches table
-- This trigger fires after each row is inserted into swipe_matches
-- and calls the create_swipe_notification() function
CREATE TRIGGER trigger_swipe_notification
  AFTER INSERT OR UPDATE ON swipe_matches
  FOR EACH ROW
  EXECUTE FUNCTION create_swipe_notification();

-- Add helpful comment
COMMENT ON TRIGGER trigger_swipe_notification ON swipe_matches IS 
  'Automatically creates notifications when users receive right swipes. Fires after each INSERT on swipe_matches and calls create_swipe_notification() to handle notification logic.';

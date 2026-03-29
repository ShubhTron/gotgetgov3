/*
  # Auto-connect users on mutual swipe

  1. Changes
    - Creates a function that checks for mutual swipes and creates connections
    - Creates a trigger that fires after insert on swipe_matches
    - When both users swipe right on each other, they become connected

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for connection creation
*/

CREATE OR REPLACE FUNCTION create_connection_on_mutual_swipe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mutual_swipe_exists boolean;
  connection_exists boolean;
BEGIN
  IF NEW.direction != 'right' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM swipe_matches
    WHERE user_id = NEW.target_user_id
      AND target_user_id = NEW.user_id
      AND direction = 'right'
  ) INTO mutual_swipe_exists;

  IF mutual_swipe_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM connections
      WHERE (user_id = NEW.user_id AND connected_user_id = NEW.target_user_id)
         OR (user_id = NEW.target_user_id AND connected_user_id = NEW.user_id)
    ) INTO connection_exists;

    IF NOT connection_exists THEN
      INSERT INTO connections (user_id, connected_user_id, status)
      VALUES (NEW.user_id, NEW.target_user_id, 'accepted')
      ON CONFLICT (user_id, connected_user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_mutual_swipe_connection ON swipe_matches;

CREATE TRIGGER trigger_mutual_swipe_connection
  AFTER INSERT ON swipe_matches
  FOR EACH ROW
  EXECUTE FUNCTION create_connection_on_mutual_swipe();

INSERT INTO connections (user_id, connected_user_id, status)
SELECT DISTINCT sm1.user_id, sm1.target_user_id, 'accepted'
FROM swipe_matches sm1
JOIN swipe_matches sm2 ON sm1.user_id = sm2.target_user_id 
  AND sm1.target_user_id = sm2.user_id
  AND sm2.direction = 'right'
WHERE sm1.direction = 'right'
  AND NOT EXISTS (
    SELECT 1 FROM connections c
    WHERE (c.user_id = sm1.user_id AND c.connected_user_id = sm1.target_user_id)
       OR (c.user_id = sm1.target_user_id AND c.connected_user_id = sm1.user_id)
  )
ON CONFLICT (user_id, connected_user_id) DO NOTHING;

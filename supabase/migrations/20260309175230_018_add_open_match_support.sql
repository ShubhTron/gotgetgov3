/*
  # Add Open Match Support for Discover Deck

  1. Changes
    - Add `is_open` boolean column to challenges table to indicate open matches
    - Add `location` text column for custom location text
    - Update RLS policy to allow authenticated users to view open challenges

  2. Security
    - Open challenges (is_open = true) are visible to all authenticated users
    - This enables the Discover deck feature where open matches appear for all users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'is_open'
  ) THEN
    ALTER TABLE challenges ADD COLUMN is_open boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenges' AND column_name = 'location'
  ) THEN
    ALTER TABLE challenges ADD COLUMN location text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_challenges_is_open ON challenges(is_open) WHERE is_open = true;

DROP POLICY IF EXISTS "Challenge participants can view challenges" ON challenges;

CREATE POLICY "Challenge participants can view challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (
    is_open = true
    OR proposed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_players cp
      WHERE cp.challenge_id = challenges.id
      AND cp.user_id = auth.uid()
    )
  );

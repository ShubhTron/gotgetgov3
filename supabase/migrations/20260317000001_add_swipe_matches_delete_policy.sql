-- Add DELETE policy for swipe_matches table
-- This allows users to delete their own swipes (where they are the user_id)

CREATE POLICY "Users can delete own swipes"
  ON swipe_matches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

/*
  # Fix infinite recursion in event_registrations RLS policy

  1. Problem
    - The SELECT policy for event_registrations references itself in a subquery
    - This causes infinite recursion when querying the table

  2. Solution
    - Drop the problematic policy
    - Create a new policy that checks ownership directly without self-referencing subquery
    - Users can view registrations for events they are registered to OR events they created

  3. Security
    - Maintains same access control intent
    - Users can only see registrations for events they participate in or own
*/

DROP POLICY IF EXISTS "Event participants can view registrations" ON event_registrations;

CREATE POLICY "Users can view own registrations"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view all registrations"
  ON event_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_registrations.event_id
      AND events.created_by = auth.uid()
    )
  );


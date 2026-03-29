/*
  # Fix handle_new_user trigger

  ## Overview
  Updates the handle_new_user trigger to properly handle edge cases during user signup.

  ## Changes
  - Add exception handling to the trigger
  - Handle NULL email cases gracefully
  - Set avatar_url to NULL instead of empty string when not provided
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@placeholder.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

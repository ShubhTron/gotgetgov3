-- Insert Mock Users for Discover Feature
-- Inserts into auth.users first (required due to FK), then profiles and sport profiles.
-- Run this in the Supabase SQL Editor as a service_role query.

DO $$
DECLARE
  users uuid[] := ARRAY[
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
    'd4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a',
    'e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b',
    'f6a7b8c9-d0e1-4f5a-8b9c-0d1e2f3a4b5c',
    'a7b8c9d0-e1f2-4a5b-8c9d-0e1f2a3b4c5d',
    'b8c9d0e1-f2a3-4b5c-8d9e-0f1a2b3c4d5e',
    'c9d0e1f2-a3b4-4c5d-8e9f-0a1b2c3d4e5f',
    'd0e1f2a3-b4c5-4d5e-8f9a-0b1c2d3e4f5a',
    'e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b',
    'f2a3b4c5-d6e7-4f5a-8b9c-0d1e2f3a4b5c',
    'a3b4c5d6-e7f8-4a5b-8c9d-0e1f2a3b4c5d',
    'b4c5d6e7-f8a9-4b5c-8d9e-0f1a2b3c4d5e',
    'c5d6e7f8-a9b0-4c5d-8e9f-0a1b2c3d4e5f',
    'd6e7f8a9-b0c1-4d5e-8f9a-0b1c2d3e4f5a',
    'e7f8a9b0-c1d2-4e5f-8a9b-0c1d2e3f4a5b',
    'f8a9b0c1-d2e3-4f5a-8b9c-0d1e2f3a4b5c',
    'a9b0c1d2-e3f4-4a5b-8c9d-0e1f2a3b4c5d',
    'b0c1d2e3-f4a5-4b5c-8d9e-0f1a2b3c4d5e'
  ];
  emails text[] := ARRAY[
    'emma.rodriguez@example.com',
    'sofia.chen@example.com',
    'isabella.martinez@example.com',
    'olivia.thompson@example.com',
    'mia.patel@example.com',
    'ava.kim@example.com',
    'charlotte.davis@example.com',
    'amelia.wilson@example.com',
    'harper.anderson@example.com',
    'evelyn.taylor@example.com',
    'luna.garcia@example.com',
    'aria.johnson@example.com',
    'scarlett.lee@example.com',
    'chloe.brown@example.com',
    'zoe.white@example.com',
    'james.miller@example.com',
    'liam.harris@example.com',
    'noah.clark@example.com',
    'ethan.martinez@example.com',
    'oliver.robinson@example.com'
  ];
  i int;
BEGIN
  FOR i IN 1..array_length(users, 1) LOOP
    -- Insert into auth.users if not exists
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, role
    )
    VALUES (
      users[i],
      emails[i],
      crypt('MockPassword123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Now insert profiles (trigger handle_new_user may have already created them, use ON CONFLICT)
INSERT INTO profiles (id, email, full_name, avatar_url, bio, location_city, location_country, created_at, updated_at)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'emma.rodriguez@example.com', 'Emma Rodriguez', 'https://i.pravatar.cc/400?img=1', 'Competitive tennis player 🎾 | Love intense rallies and strategic play | Looking for doubles partners', 'Los Angeles', 'USA', NOW(), NOW()),
  ('b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e', 'sofia.chen@example.com', 'Sofia Chen', 'https://i.pravatar.cc/400?img=5', 'Badminton enthusiast 🏸 | Former college champion | Casual games welcome!', 'San Francisco', 'USA', NOW(), NOW()),
  ('c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f', 'isabella.martinez@example.com', 'Isabella Martinez', 'https://i.pravatar.cc/400?img=9', 'Squash player | High intensity workouts | Always up for a challenge 💪', 'Miami', 'USA', NOW(), NOW()),
  ('d4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a', 'olivia.thompson@example.com', 'Olivia Thompson', 'https://i.pravatar.cc/400?img=10', 'Tennis coach & player 🎾 | USPTA certified | Love teaching and playing', 'Austin', 'USA', NOW(), NOW()),
  ('e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b', 'mia.patel@example.com', 'Mia Patel', 'https://i.pravatar.cc/400?img=16', 'Pickleball addict 🏓 | Friendly and social player | Let''s have fun!', 'Seattle', 'USA', NOW(), NOW()),
  ('f6a7b8c9-d0e1-4f5a-8b9c-0d1e2f3a4b5c', 'ava.kim@example.com', 'Ava Kim', 'https://i.pravatar.cc/400?img=20', 'Table tennis pro 🏓 | Fast reflexes | Competitive but friendly', 'New York', 'USA', NOW(), NOW()),
  ('a7b8c9d0-e1f2-4a5b-8c9d-0e1f2a3b4c5d', 'charlotte.davis@example.com', 'Charlotte Davis', 'https://i.pravatar.cc/400?img=24', 'Recreational tennis player 🎾 | Weekend warrior | Looking for consistent partners', 'Chicago', 'USA', NOW(), NOW()),
  ('b8c9d0e1-f2a3-4b5c-8d9e-0f1a2b3c4d5e', 'amelia.wilson@example.com', 'Amelia Wilson', 'https://i.pravatar.cc/400?img=26', 'Badminton & tennis player ��🎾 | Versatile athlete | Love trying new sports', 'Boston', 'USA', NOW(), NOW()),
  ('c9d0e1f2-a3b4-4c5d-8e9f-0a1b2c3d4e5f', 'harper.anderson@example.com', 'Harper Anderson', 'https://i.pravatar.cc/400?img=29', 'Squash enthusiast | Fitness focused | Early morning games preferred', 'Denver', 'USA', NOW(), NOW()),
  ('d0e1f2a3-b4c5-4d5e-8f9a-0b1c2d3e4f5a', 'evelyn.taylor@example.com', 'Evelyn Taylor', 'https://i.pravatar.cc/400?img=32', 'Social tennis player 🎾 | More about fun than winning | Coffee after?', 'Portland', 'USA', NOW(), NOW()),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'luna.garcia@example.com', 'Luna Garcia', 'https://i.pravatar.cc/400?img=36', 'Competitive badminton player 🏸 | Tournament regular | Seeking practice partners', 'San Diego', 'USA', NOW(), NOW()),
  ('f2a3b4c5-d6e7-4f5a-8b9c-0d1e2f3a4b5c', 'aria.johnson@example.com', 'Aria Johnson', 'https://i.pravatar.cc/400?img=38', 'Tennis & pickleball 🎾🏓 | Intermediate level | Always learning', 'Phoenix', 'USA', NOW(), NOW()),
  ('a3b4c5d6-e7f8-4a5b-8c9d-0e1f2a3b4c5d', 'scarlett.lee@example.com', 'Scarlett Lee', 'https://i.pravatar.cc/400?img=41', 'Squash player | Aggressive style | Love the intensity 🔥', 'Atlanta', 'USA', NOW(), NOW()),
  ('b4c5d6e7-f8a9-4b5c-8d9e-0f1a2b3c4d5e', 'chloe.brown@example.com', 'Chloe Brown', 'https://i.pravatar.cc/400?img=43', 'Recreational player 🎾 | Beginner-friendly | Let''s improve together!', 'Dallas', 'USA', NOW(), NOW()),
  ('c5d6e7f8-a9b0-4c5d-8e9f-0a1b2c3d4e5f', 'zoe.white@example.com', 'Zoe White', 'https://i.pravatar.cc/400?img=47', 'Table tennis enthusiast 🏓 | Quick games during lunch | Work-life balance', 'San Jose', 'USA', NOW(), NOW()),
  ('d6e7f8a9-b0c1-4d5e-8f9a-0b1c2d3e4f5a', 'james.miller@example.com', 'James Miller', 'https://i.pravatar.cc/400?img=12', 'Tennis player 🎾 | Consistent baseline player | Looking for regular matches', 'Los Angeles', 'USA', NOW(), NOW()),
  ('e7f8a9b0-c1d2-4e5f-8a9b-0c1d2e3f4a5b', 'liam.harris@example.com', 'Liam Harris', 'https://i.pravatar.cc/400?img=13', 'Badminton player 🏸 | Former club champion | Competitive mindset', 'Seattle', 'USA', NOW(), NOW()),
  ('f8a9b0c1-d2e3-4f5a-8b9c-0d1e2f3a4b5c', 'noah.clark@example.com', 'Noah Clark', 'https://i.pravatar.cc/400?img=14', 'Squash enthusiast | Fast-paced games | Fitness is key 💪', 'Boston', 'USA', NOW(), NOW()),
  ('a9b0c1d2-e3f4-4a5b-8c9d-0e1f2a3b4c5d', 'ethan.martinez@example.com', 'Ethan Martinez', 'https://i.pravatar.cc/400?img=15', 'Tennis & pickleball 🎾🏓 | Social player | Weekend games', 'Miami', 'USA', NOW(), NOW()),
  ('b0c1d2e3-f4a5-4b5c-8d9e-0f1a2b3c4d5e', 'oliver.robinson@example.com', 'Oliver Robinson', 'https://i.pravatar.cc/400?img=17', 'Recreational tennis 🎾 | Beginner-intermediate | Just for fun!', 'Chicago', 'USA', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  location_city = EXCLUDED.location_city,
  location_country = EXCLUDED.location_country;

-- Insert sport profiles
INSERT INTO user_sport_profiles (user_id, sport, self_assessed_level, official_rating, official_rating_system, play_style, created_at, updated_at)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'tennis', 'advanced', '4.5', 'NTRP', 'Aggressive baseline player with strong forehand', NOW(), NOW()),
  ('b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e', 'badminton', 'expert', '1850', 'BWF', 'All-court player, excellent net play', NOW(), NOW()),
  ('c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f', 'squash', 'advanced', '3.8', 'Club', 'Power player, aggressive shots', NOW(), NOW()),
  ('d4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a', 'tennis', 'expert', '5.0', 'NTRP', 'Consistent all-court player, great volleys', NOW(), NOW()),
  ('e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b', 'pickleball', 'intermediate', '3.5', 'USAPA', 'Dinking specialist, patient player', NOW(), NOW()),
  ('f6a7b8c9-d0e1-4f5a-8b9c-0d1e2f3a4b5c', 'table_tennis', 'expert', '2100', 'USATT', 'Fast attacking style, excellent reflexes', NOW(), NOW()),
  ('a7b8c9d0-e1f2-4a5b-8c9d-0e1f2a3b4c5d', 'tennis', 'intermediate', '3.5', 'NTRP', 'Steady baseline player', NOW(), NOW()),
  ('b8c9d0e1-f2a3-4b5c-8d9e-0f1a2b3c4d5e', 'badminton', 'advanced', '1650', 'BWF', 'Versatile player, good defense', NOW(), NOW()),
  ('b8c9d0e1-f2a3-4b5c-8d9e-0f1a2b3c4d5e', 'tennis', 'intermediate', '3.0', 'NTRP', 'Recreational player', NOW(), NOW()),
  ('c9d0e1f2-a3b4-4c5d-8e9f-0a1b2c3d4e5f', 'squash', 'intermediate', '3.2', 'Club', 'Fitness-focused, consistent', NOW(), NOW()),
  ('d0e1f2a3-b4c5-4d5e-8f9a-0b1c2d3e4f5a', 'tennis', 'beginner', '2.5', 'NTRP', 'Social player, learning', NOW(), NOW()),
  ('e1f2a3b4-c5d6-4e5f-8a9b-0c1d2e3f4a5b', 'badminton', 'advanced', '1750', 'BWF', 'Tournament player, competitive', NOW(), NOW()),
  ('f2a3b4c5-d6e7-4f5a-8b9c-0d1e2f3a4b5c', 'tennis', 'intermediate', '3.0', 'NTRP', 'Improving player', NOW(), NOW()),
  ('f2a3b4c5-d6e7-4f5a-8b9c-0d1e2f3a4b5c', 'pickleball', 'intermediate', '3.0', 'USAPA', 'Learning strategy', NOW(), NOW()),
  ('a3b4c5d6-e7f8-4a5b-8c9d-0e1f2a3b4c5d', 'squash', 'advanced', '4.0', 'Club', 'Aggressive, fast-paced', NOW(), NOW()),
  ('b4c5d6e7-f8a9-4b5c-8d9e-0f1a2b3c4d5e', 'tennis', 'beginner', '2.0', 'NTRP', 'Just starting out', NOW(), NOW()),
  ('c5d6e7f8-a9b0-4c5d-8e9f-0a1b2c3d4e5f', 'table_tennis', 'intermediate', '1600', 'USATT', 'Quick games, casual', NOW(), NOW()),
  ('d6e7f8a9-b0c1-4d5e-8f9a-0b1c2d3e4f5a', 'tennis', 'advanced', '4.0', 'NTRP', 'Baseline player, consistent', NOW(), NOW()),
  ('e7f8a9b0-c1d2-4e5f-8a9b-0c1d2e3f4a5b', 'badminton', 'expert', '1900', 'BWF', 'Former champion, competitive', NOW(), NOW()),
  ('f8a9b0c1-d2e3-4f5a-8b9c-0d1e2f3a4b5c', 'squash', 'advanced', '3.9', 'Club', 'Fast player, fitness focused', NOW(), NOW()),
  ('a9b0c1d2-e3f4-4a5b-8c9d-0e1f2a3b4c5d', 'tennis', 'intermediate', '3.5', 'NTRP', 'Social player', NOW(), NOW()),
  ('a9b0c1d2-e3f4-4a5b-8c9d-0e1f2a3b4c5d', 'pickleball', 'intermediate', '3.5', 'USAPA', 'Weekend warrior', NOW(), NOW()),
  ('b0c1d2e3-f4a5-4b5c-8d9e-0f1a2b3c4d5e', 'tennis', 'beginner', '2.5', 'NTRP', 'Recreational, fun-focused', NOW(), NOW())
ON CONFLICT (user_id, sport) DO NOTHING;

-- Verification script for migration 030
-- Run this after applying the migration to verify everything was created correctly

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('profile_details', 'profile_photos', 'discovery_mode_analytics') 
    THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')
ORDER BY table_name;

-- Check columns for profile_details
SELECT 
  'profile_details' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profile_details'
ORDER BY ordinal_position;

-- Check columns for profile_photos
SELECT 
  'profile_photos' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profile_photos'
ORDER BY ordinal_position;

-- Check columns for discovery_mode_analytics
SELECT 
  'discovery_mode_analytics' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'discovery_mode_analytics'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')
ORDER BY tablename, policyname;

-- Check foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')
ORDER BY tc.table_name, tc.constraint_name;

-- Summary
SELECT 
  'Migration 030 Verification Complete' as message,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')) as tables_created,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')) as indexes_created,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('profile_details', 'profile_photos', 'discovery_mode_analytics')) as policies_created;


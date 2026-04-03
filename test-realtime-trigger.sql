-- Test script to verify the broadcast_new_message trigger is working
-- Run this in your Supabase SQL editor to test

-- 1. Check if the trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'trg_broadcast_new_message';

-- 2. Check if the function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'broadcast_new_message';

-- 3. Check if realtime.send function exists
SELECT 
  proname as function_name,
  pronamespace::regnamespace as schema
FROM pg_proc
WHERE proname = 'send' AND pronamespace::regnamespace::text = 'realtime';

-- 4. Test the trigger by inserting a test message (replace with actual IDs)
-- INSERT INTO messages (conversation_id, sender_id, content)
-- VALUES ('your-conversation-id', 'your-user-id', 'Test message from trigger verification');

-- 5. Check RLS policies on realtime.messages
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'messages' AND schemaname = 'realtime';

# Migration 048: Swipe Notification Trigger

## Overview
This migration implements the `create_swipe_notification()` trigger function that automatically creates notifications when users receive right swipes.

**Feature:** swipe-right-notifications  
**Task:** 1.2 Implement create_swipe_notification() trigger function  
**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3

## What This Migration Does

The trigger function:
1. ✅ Checks for right swipe direction (ignores left swipes)
2. ✅ Prevents duplicate notifications for same swiper-target-sport combination
3. ✅ Fetches swiper name with fallback to "Someone" if missing
4. ✅ Formats sport name for display (e.g., "table_tennis" → "Table Tennis")
5. ✅ Inserts notification with complete data structure
6. ✅ Uses SECURITY DEFINER to ensure proper permissions

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project SQL editor
2. Copy the contents of `20260316000005_048_create_swipe_notification_trigger.sql`
3. Paste and execute the SQL

### Option 2: Supabase CLI
```bash
supabase db push
```

## How to Verify

After applying the migration, run the verification script:

```bash
node supabase/verify_swipe_notification_trigger.mjs
```

This will test:
- ✅ Right swipe creates notification
- ✅ Notification contains correct data (title, body, swiper_id, sport)
- ✅ Duplicate prevention works
- ✅ Different sports create separate notifications
- ✅ Left swipes don't create notifications

## Expected Notification Format

When a user swipes right, the target user receives:

```json
{
  "type": "swipe_right_received",
  "title": "John Doe swiped right on you",
  "body": "Interested in playing Tennis",
  "data": {
    "swiper_id": "uuid-of-swiper",
    "sport": "tennis"
  },
  "read": false
}
```

## Dependencies

This migration requires:
- Migration 047: `swipe_right_received` notification type must exist
- Tables: `swipe_matches`, `notifications`, `profiles`

## Next Steps

After this migration is applied:
1. Task 1.3: Register trigger on swipe_matches table (separate migration)
2. Frontend implementation to display these notifications
3. Property-based tests for notification creation logic

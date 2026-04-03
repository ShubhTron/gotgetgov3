# Edge Cases Quick Reference Guide

## Quick Overview

This guide provides a quick reference for understanding the edge case handling in the Circles Tab MATCHES view.

## Error Types and Messages

| Error Type | Error Code | User Message | Has Retry? | Uses Cache Fallback? |
|------------|------------|--------------|------------|---------------------|
| Not Authenticated | `UNAUTHENTICATED` | "Please sign in to view your matches and activity." | ❌ No | ❌ No |
| Network Timeout | `NETWORK_TIMEOUT` | "Request timed out. Please check your connection and try again." | ✅ Yes | ✅ Yes |
| Invalid Data | `INVALID_DATA_FORMAT` | "Received invalid data from server. Please try again or contact support." | ✅ Yes | ✅ Yes |
| Network Error | Generic Error | "Unable to load your matches. Please try again." | ✅ Yes | ✅ Yes |
| Empty Data | No error | "No activity yet. Play some matches and join tournaments to see your feed come to life." | ❌ No (CTA button) | ❌ N/A |

## Error Message Variations (with Cache)

When cached data is available, error messages change:

| Error Type | Message with Cache |
|------------|-------------------|
| Network Timeout | "Request timed out. Showing cached data. Tap to retry." |
| Invalid Data | "Received invalid data. Showing cached data. Tap to retry." |
| Network Error | "Connection error. Showing cached data. Tap to retry." |

## Code Snippets

### Triggering Specific Errors (for testing)

```typescript
// 1. Test unauthenticated state
// Log out or use incognito mode

// 2. Test empty data
// Use a new user account with no activity

// 3. Test network timeout
// In CirclesPage.tsx, reduce timeout to 5 seconds:
const timeoutId = setTimeout(() => {
  // ...
}, 5000); // Changed from 30000

// 4. Test invalid data format
// In feed-api.ts, temporarily return invalid data:
export async function fetchHeroMatch(userId: string) {
  return { invalid: 'data' } as any;
}

// 5. Test cache corruption
// In CirclesPage.tsx, inject corrupted cache:
vi.mocked(feedApi.getCachedData).mockReturnValue({
  heroMatch: 'invalid',
  challenges: null,
} as any);
```

### Checking Error State in DevTools

```javascript
// In browser console:

// Check if user is authenticated
console.log('User:', window.__AUTH_USER__);

// Check cache state (if exposed)
console.log('Cache:', window.__FEED_CACHE__);

// Monitor network requests
// Open DevTools → Network tab → Filter by "fetch"

// Simulate slow network
// DevTools → Network tab → Throttling → Slow 3G
```

## Validation Function

The `validateFeedData()` function checks:

```typescript
✅ data is an object
✅ data.heroMatch exists (can be null or object)
✅ data.challenges is an array
✅ data.openMatches is an array
✅ data.weeklyMatches is an array
✅ data.tournaments is an array
```

**Fails validation if:**
- ❌ data is null or undefined
- ❌ data is not an object
- ❌ Missing required fields
- ❌ Fields have wrong types (e.g., string instead of array)

## Timeout Behavior

```
Request starts
    ↓
  30 seconds pass
    ↓
AbortController.abort() called
    ↓
Request cancelled
    ↓
Check for stale cache
    ↓
If cache exists → Show cached data + error banner
If no cache → Show timeout error + retry button
```

## Cache Strategy

```
Cache TTL: 5 minutes
Max cache size: 5 entries
Eviction: LRU (Least Recently Used)

Fresh cache (< 5 min old):
  ✅ Used immediately
  ✅ No network request

Stale cache (> 5 min old):
  ⚠️ Not used automatically
  ✅ Used as fallback on error
  🔄 Fresh data fetched

Corrupted cache:
  ❌ Detected by validation
  🗑️ Cleared automatically
  🔄 Fresh data fetched
```

## Error Logging

All errors are logged with:
- ✅ Error message and stack trace
- ✅ Timestamp
- ✅ Context (where error occurred)
- ✅ User ID
- ✅ Additional metadata

Example log:
```javascript
{
  message: "Failed to fetch feed data",
  stack: "Error: Failed to fetch...",
  timestamp: "2024-03-30T12:34:56.789Z",
  context: "Feed Data Fetching",
  userId: "user-123",
  metadata: {
    activeSegment: "MATCHES",
    hasCachedData: true,
    errorName: "NetworkError",
    errorMessage: "Failed to fetch"
  }
}
```

## Component Responsibilities

### CirclesPage.tsx
- ✅ Validates user authentication
- ✅ Validates cache data structure
- ✅ Implements timeout mechanism
- ✅ Validates API response format
- ✅ Detects and clears corrupted cache
- ✅ Logs all errors with context
- ✅ Manages cache fallback strategy

### MatchesView.tsx
- ✅ Displays appropriate error messages
- ✅ Shows loading skeletons
- ✅ Shows empty state
- ✅ Shows error states with retry buttons
- ✅ Shows cached data with error banners
- ✅ Handles all error types

## Common Issues and Solutions

### Issue: Timeout not triggering
**Solution:** Check that timeout is set to 30 seconds (30000ms) and network is actually slow.

### Issue: Cache not being used
**Solution:** Verify cache is populated by checking `getCachedData('all')` returns data.

### Issue: Validation failing on valid data
**Solution:** Check that all required fields exist in FeedData type and match validation logic.

### Issue: Error messages not displaying
**Solution:** Verify error state is being set correctly and MatchesView is checking error.message.

### Issue: Retry button not working
**Solution:** Ensure `onRefresh` prop is passed to MatchesView and calls the correct fetch function.

## Testing Checklist

Quick checklist for testing edge cases:

- [ ] User not authenticated → Auth error message
- [ ] Empty data → Empty state with CTA button
- [ ] Network timeout → Timeout error + retry
- [ ] Timeout with cache → Cached data + timeout banner
- [ ] Invalid data → Invalid data error + retry
- [ ] Invalid data with cache → Cached data + invalid banner
- [ ] Network error → Network error + retry
- [ ] Network error with cache → Cached data + error banner
- [ ] Corrupted cache → Cache cleared, fresh fetch
- [ ] Retry button → Refetches data
- [ ] Loading state → Skeleton loaders
- [ ] Success state → Feed data displays

## Performance Metrics

Target metrics:
- ⚡ Cache hit: < 50ms
- ⚡ Fresh fetch: < 2s
- ⚡ Timeout: 30s
- ⚡ Validation: < 1ms
- ⚡ Error recovery: < 100ms

## Debugging Tips

1. **Check console logs** - All errors are logged with context
2. **Use React DevTools** - Inspect component state
3. **Monitor Network tab** - See actual API requests
4. **Check cache state** - Verify cache is working
5. **Test with throttling** - Simulate slow networks
6. **Use breakpoints** - Debug validation logic
7. **Check error boundaries** - Ensure errors don't crash app

## Related Files

- `src/pages/circles/CirclesPage.tsx` - Main logic
- `src/pages/circles/MatchesView.tsx` - UI rendering
- `src/api/feed-api.ts` - Data fetching and caching
- `src/lib/error-logging.ts` - Error logging utility
- `src/components/ui/error-state.tsx` - Error UI component
- `src/components/ui/empty-state.tsx` - Empty state UI component

## Support

For questions or issues:
1. Check this guide first
2. Review implementation summary document
3. Check manual testing guide
4. Review automated tests
5. Contact development team

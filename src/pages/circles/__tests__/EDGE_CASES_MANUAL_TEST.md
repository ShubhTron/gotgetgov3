# Edge Cases Manual Testing Guide

This document provides step-by-step instructions for manually testing all edge cases implemented in task 5.3.

## Test Environment Setup

Before testing, ensure you have:
- A development environment running (`npm run dev`)
- Access to browser DevTools (Network tab, Console)
- Test user accounts (authenticated and unauthenticated states)

## Edge Case 1: User Not Authenticated

### Test Steps:
1. Open the application in an incognito/private browser window
2. Navigate to `/circles` route
3. Ensure you are NOT logged in (no user session)

### Expected Results:
- ✅ MATCHES view displays by default
- ✅ Error message: "Please sign in to view your matches and activity."
- ✅ No retry button shown (authentication required)
- ✅ No network requests made to fetch feed data
- ✅ Console shows no errors related to undefined user

### Pass Criteria:
- User sees clear authentication prompt
- No crashes or console errors
- CIRCLES view still works (shows empty conversations)

---

## Edge Case 2: feedData is Null or Empty

### Test Steps:
1. Log in with a test user account
2. Ensure the user has:
   - No match results in database
   - No incoming challenges
   - No open matches nearby
   - No weekly matches
   - No active tournaments
3. Navigate to Circles tab → MATCHES view
4. Wait for data to load

### Expected Results:
- ✅ Loading skeleton displays briefly
- ✅ Empty state appears with:
  - Trophy icon in circle
  - Heading: "No activity yet"
  - Message: "Play some matches and join tournaments to see your feed come to life."
  - "Find Matches" button
- ✅ No error messages shown
- ✅ Button is clickable (logs to console)

### Pass Criteria:
- Empty state is visually appealing and informative
- User understands why content is empty
- Call-to-action button is present

---

## Edge Case 3: Network Request Times Out

### Test Steps:
1. Log in with a test user account
2. Open browser DevTools → Network tab
3. Throttle network to "Slow 3G" or use network throttling
4. Clear any cached data (Application → Clear storage)
5. Navigate to Circles tab → MATCHES view
6. Wait for 30+ seconds

### Expected Results:
- ✅ Loading skeleton displays initially
- ✅ After 30 seconds, timeout error appears:
  - "Request timed out. Please check your connection and try again."
  - Red error banner with "Retry" button
- ✅ If stale cache exists:
  - Cached data displays
  - Error banner: "Request timed out. Showing cached data. Tap to retry."
- ✅ Console logs timeout error with context

### Pass Criteria:
- Timeout occurs at 30 seconds (not sooner or later)
- Error message is clear and actionable
- Retry button refetches data
- Cached data used as fallback when available

### Testing Timeout with DevTools:
```javascript
// In browser console, you can simulate timeout by:
// 1. Go to Network tab
// 2. Right-click on feed API requests
// 3. Select "Block request URL"
// 4. Refresh page
```

---

## Edge Case 4: API Returns Invalid Data Format

### Test Steps:
1. Log in with a test user account
2. Open browser DevTools → Console
3. Intercept API response (using DevTools or proxy)
4. Modify response to return invalid data:
   ```javascript
   // Invalid: missing required fields
   { heroMatch: "invalid", challenges: null }
   
   // Invalid: wrong types
   { heroMatch: [], challenges: "string" }
   ```
5. Navigate to MATCHES view

### Expected Results:
- ✅ Validation detects invalid data format
- ✅ Error message: "Received invalid data from server. Please try again or contact support."
- ✅ If stale cache exists:
  - Cached data displays
  - Error banner: "Received invalid data. Showing cached data. Tap to retry."
- ✅ Console logs validation error with data details
- ✅ Retry button attempts to refetch

### Pass Criteria:
- Invalid data doesn't crash the app
- Validation catches malformed responses
- User sees helpful error message
- Cached data used as fallback

### Simulating Invalid Data:
You can use browser extensions like "ModHeader" or "Requestly" to intercept and modify API responses, or temporarily modify the feed-api.ts file to return invalid data.

---

## Edge Case 5: Cache is Corrupted

### Test Steps:
1. Log in with a test user account
2. Open browser DevTools → Console
3. Manually corrupt the cache by running:
   ```javascript
   // Access the feed cache (if exposed) or use localStorage
   // Inject invalid data structure
   ```
4. Navigate to MATCHES view
5. Observe behavior

### Expected Results:
- ✅ Corrupted cache detected by validation
- ✅ Cache is cleared automatically
- ✅ Fresh data fetched from API
- ✅ Console logs cache corruption error
- ✅ No crash or infinite loops

### Pass Criteria:
- App recovers from corrupted cache
- Fresh data fetched successfully
- Error logged for debugging
- User experience not disrupted

### Testing Cache Corruption:
Since the cache is in-memory (Map), you can test this by:
1. Modifying feed-api.ts temporarily to return corrupted cache
2. Or using React DevTools to inject invalid state

---

## Edge Case 6: Appropriate Error Messages

### Test Steps:
Test each error scenario and verify the error message:

| Scenario | Expected Message |
|----------|------------------|
| Not authenticated | "Please sign in to view your matches and activity." |
| Network timeout | "Request timed out. Please check your connection and try again." |
| Invalid data format | "Received invalid data from server. Please try again or contact support." |
| General network error | "Unable to load your matches. Please try again." |
| Timeout with cache | "Request timed out. Showing cached data. Tap to retry." |
| Invalid data with cache | "Received invalid data. Showing cached data. Tap to retry." |
| General error with cache | "Connection error. Showing cached data. Tap to retry." |

### Expected Results:
- ✅ Each error has a specific, user-friendly message
- ✅ Messages explain what happened
- ✅ Messages suggest next steps
- ✅ Technical jargon avoided
- ✅ Consistent tone and style

### Pass Criteria:
- All error messages are clear and actionable
- Users understand what went wrong
- Users know how to proceed

---

## Edge Case 7: Retry and Fallback Options

### Test Steps:

#### Test 7a: Retry Button Functionality
1. Trigger any error (network failure, timeout, etc.)
2. Verify "Retry" button appears
3. Click "Retry" button
4. Observe behavior

**Expected Results:**
- ✅ Retry button is visible and clickable
- ✅ Clicking retry triggers new fetch request
- ✅ Loading state shows during retry
- ✅ Success: data loads and error clears
- ✅ Failure: error message persists

#### Test 7b: Stale Cache Fallback
1. Load MATCHES view successfully (cache populated)
2. Wait 6+ minutes (cache expires)
3. Disconnect network or block API requests
4. Switch to CIRCLES view, then back to MATCHES
5. Observe behavior

**Expected Results:**
- ✅ Stale cached data displays immediately
- ✅ Error banner shows: "Connection error. Showing cached data."
- ✅ Retry button available
- ✅ User can still view cached content
- ✅ No blank screen or crash

#### Test 7c: No Cache Fallback
1. Clear all cache and storage
2. Disconnect network
3. Navigate to MATCHES view

**Expected Results:**
- ✅ Error state displays (no cached data available)
- ✅ Retry button available
- ✅ Clear error message
- ✅ No attempt to show empty/null data

### Pass Criteria:
- Retry mechanism works reliably
- Stale cache provides graceful degradation
- User always has a path forward

---

## Edge Case 8: Test Each Edge Case Scenario

### Comprehensive Test Matrix

| Test Case | User Auth | Network | Cache | Expected Outcome |
|-----------|-----------|---------|-------|------------------|
| 1 | ❌ No | ✅ Good | ❌ None | Auth error message |
| 2 | ✅ Yes | ✅ Good | ❌ None | Empty state (no data) |
| 3 | ✅ Yes | ⏱️ Timeout | ❌ None | Timeout error + retry |
| 4 | ✅ Yes | ⏱️ Timeout | ✅ Stale | Cached data + timeout banner |
| 5 | ✅ Yes | ❌ Invalid | ❌ None | Invalid data error + retry |
| 6 | ✅ Yes | ❌ Invalid | ✅ Stale | Cached data + invalid banner |
| 7 | ✅ Yes | ✅ Good | 🔴 Corrupt | Cache cleared, fresh fetch |
| 8 | ✅ Yes | ❌ Failed | ❌ None | Network error + retry |
| 9 | ✅ Yes | ❌ Failed | ✅ Stale | Cached data + error banner |
| 10 | ✅ Yes | ✅ Good | ✅ Fresh | Data from cache (no fetch) |

### Testing Checklist:
- [ ] All 10 scenarios tested
- [ ] Error messages appropriate for each case
- [ ] Retry buttons work in all error states
- [ ] Cached data used as fallback when available
- [ ] No crashes or console errors
- [ ] Loading states display correctly
- [ ] Empty states display when appropriate
- [ ] User can recover from all error states

---

## Performance Testing

### Cache Effectiveness
1. Load MATCHES view (cold start)
2. Note load time
3. Switch to CIRCLES view
4. Switch back to MATCHES view
5. Note load time (should be instant from cache)

**Expected:**
- ✅ Second load is instant (< 50ms)
- ✅ No network requests on cached load
- ✅ Cache expires after 5 minutes

### Timeout Accuracy
1. Use network throttling to simulate slow connection
2. Measure time from request start to timeout error
3. Verify timeout occurs at 30 seconds (±500ms)

**Expected:**
- ✅ Timeout at 30 seconds
- ✅ Request aborted properly
- ✅ No memory leaks from pending requests

---

## Accessibility Testing

### Screen Reader Announcements
1. Use screen reader (NVDA, JAWS, VoiceOver)
2. Navigate to MATCHES view
3. Trigger various error states
4. Verify error messages are announced

**Expected:**
- ✅ Error messages announced to screen reader
- ✅ Retry buttons have proper labels
- ✅ Loading states announced
- ✅ Empty states announced

### Keyboard Navigation
1. Use only keyboard (Tab, Enter, Escape)
2. Navigate through error states
3. Activate retry buttons

**Expected:**
- ✅ All interactive elements keyboard accessible
- ✅ Focus visible on retry buttons
- ✅ Logical tab order

---

## Regression Testing

After implementing edge case handling, verify:
- [ ] Normal flow still works (authenticated user with data)
- [ ] Segment switching still works
- [ ] Scroll position preservation still works
- [ ] Chat navigation still works
- [ ] CIRCLES view unaffected
- [ ] No performance degradation
- [ ] No new console warnings/errors

---

## Bug Reporting Template

If any test fails, report using this template:

```
**Test Case:** [Edge Case Number and Name]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Console Logs:**
[Attach evidence]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- Version: [Browser version]
- OS: [Windows/Mac/Linux]
- Network: [WiFi/4G/Throttled]
```

---

## Test Sign-Off

Once all tests pass:
- [ ] All edge cases tested and verified
- [ ] Error messages reviewed and approved
- [ ] Retry mechanisms work correctly
- [ ] Cache fallback works correctly
- [ ] No regressions in existing functionality
- [ ] Performance acceptable
- [ ] Accessibility requirements met

**Tested by:** _______________
**Date:** _______________
**Sign-off:** _______________

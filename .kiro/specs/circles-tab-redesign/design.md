# Design Document: Circles Tab Redesign

## Overview

The Circles Tab Redesign transforms the current circles-only interface into a dual-view system with a segmented control that allows users to switch between "MATCHES" (feed content) and "CIRCLES" (social content). This redesign brings the comprehensive feed system (hero match card, challenges, open matches, weekly digest, tournaments) into the Circles tab while preserving all existing social functionality. Additionally, the Feed/News tab will be reverted to display the previous gradient card news feed.

The redesign modifies `src/pages/circles/CirclesPage.tsx` to include:
- A segmented control component for switching between MATCHES and CIRCLES views
- A MATCHES view displaying the feed system content (hero match, challenges, open matches, digest, tournaments)
- A CIRCLES view wrapping the existing CirclesListView component
- Independent scroll position management for each view
- Feed data caching and state management

The system integrates with existing database tables (`match_results`, `challenges`, `competitions`, `profiles`, `conversations`) and follows the established design system patterns using CSS custom properties and inline styles.

## Architecture

### System Integration

The Circles tab redesign integrates into the existing GotGetGo application architecture:

```
App.tsx (BrowserRouter)
  └─ AuthProvider
      └─ FilterProvider
          └─ AppShell
              └─ CirclesPage (enhanced with segmented control)
                  ├─ SegmentedControl
                  ├─ MatchesView (new)
                  └─ CirclesView (wraps CirclesListView)
```

**Route Configuration:**
- Path: `/circles` (maintains existing route)
- Access: `GuestRoute` (accessible to authenticated users and guests)
- Navigation: Accessible via bottom tab bar "Circles" tab

**Context Dependencies:**
- `AuthContext`: Provides current user information for personalized content
- `FilterContext`: Manages feed filter state (not used in initial implementation)
- `NavVisibilityContext`: Controls header/tab bar visibility during chat navigation
- `GuestTutorialContext`: Manages tutorial state for guest users


### Data Flow

```
CirclesPage Component
  ├─ useState() → activeSegment ('MATCHES' | 'CIRCLES')
  ├─ useState() → feedData (hero, challenges, openMatches, weeklyMatches, tournaments)
  ├─ useState() → scrollPositions (MATCHES, CIRCLES)
  ├─ useConversations() → conversations data (existing)
  └─ useEffect() → fetch feed data when MATCHES segment active
      ├─ fetchHeroMatch() → Hero card data
      ├─ fetchChallenges() → Challenge cards
      ├─ fetchOpenMatches() → Open match cards
      ├─ fetchWeeklyMatches() → Digest card
      └─ fetchTournaments() → Tournament cards
```

**State Management:**
- Segment state for active view (MATCHES or CIRCLES)
- Feed data state for MATCHES view content
- Scroll position state for each view (preserved on switch)
- Loading and error states for feed data
- Existing conversation state from useConversations hook

### Performance Strategy

**Initial Load:**
1. Render segmented control immediately (< 100ms)
2. Default to MATCHES view
3. Display skeleton loaders for feed content
4. Fetch feed data in parallel using Promise.all()
5. Render sections as data arrives (progressive rendering)

**View Switching:**
1. User taps segment → update activeSegment state
2. Preserve current scroll position
3. Restore previous scroll position for target view
4. If MATCHES view and no cached data, fetch feed data
5. Animate view transition (300ms)

**Optimization Techniques:**
- Cache feed data in memory for 5 minutes
- Preserve scroll positions when switching views
- Reuse existing feed components from feed-tab-redesign
- Lazy load images with existing patterns
- Debounce rapid segment switches (300ms)


## Components and Interfaces

### Component Hierarchy

```
CirclesPage (enhanced)
├─ SegmentedControl (new)
│   ├─ SegmentButton (MATCHES)
│   └─ SegmentButton (CIRCLES)
├─ MatchesView (new, conditional on activeSegment === 'MATCHES')
│   ├─ HeroSection (from feed components)
│   ├─ ChallengesSection (from feed components)
│   ├─ OpenMatchesSection (from feed components)
│   ├─ DigestSection (from feed components)
│   └─ TournamentsSection (from feed components)
└─ CirclesView (new wrapper, conditional on activeSegment === 'CIRCLES')
    └─ CirclesListView (existing)
        ├─ StoriesStrip
        ├─ SearchBar
        ├─ TabBar (DMs, Groups, Broadcast)
        ├─ ConversationList
        └─ NewChatSheet
```

### Component Specifications

#### CirclesPage (Enhanced)
**Purpose:** Root container managing segment state, feed data, and view switching
**Props:** None (uses contexts)
**State:**
- `activeSegment: 'MATCHES' | 'CIRCLES'`
- `feedData: FeedData` (hero, challenges, openMatches, weeklyMatches, tournaments)
- `loading: boolean`
- `error: Error | null`
- `scrollPositions: { MATCHES: number; CIRCLES: number }`
- Existing: `screen: CirclesScreen` (for chat navigation)

**Key Changes from Current:**
- Add segmented control above content
- Add MATCHES view with feed content
- Wrap CirclesListView in CIRCLES view
- Manage scroll position preservation
- Fetch and cache feed data

#### SegmentedControl (New)
**Purpose:** Toggle between MATCHES and CIRCLES views
**Props:**
- `activeSegment: 'MATCHES' | 'CIRCLES'`
- `onSegmentChange: (segment: 'MATCHES' | 'CIRCLES') => void`
**Styling:**
- Fixed position below any header
- Height: 44px
- Background: `var(--color-bg)`
- Padding: 8px 16px
- Border bottom: 1px solid `var(--color-bdr)`

**Segment Button Styling:**
- Active: Dark background (`var(--color-t1)`), white text
- Inactive: White background (`var(--color-surf)`), gray text (`var(--color-t2)`)
- Border radius: 10px
- Padding: 8px 20px
- Font: 14px, weight 700
- Transition: all 0.2s ease


#### MatchesView (New)
**Purpose:** Container for feed system content in MATCHES segment
**Props:**
- `feedData: FeedData`
- `loading: boolean`
- `error: Error | null`
- `onRefresh: () => void`
**Styling:**
- Background: `var(--color-bg)`
- Padding: 0 16px 80px (bottom padding for tab bar)
- Overflow-y: auto
- Webkit-overflow-scrolling: touch

**Content Sections:**
- Reuses all feed components from `src/components/feed/`
- HeroSection with hero match card and ELO strip
- ChallengesSection with challenge cards
- OpenMatchesSection with horizontal scroll
- DigestSection with weekly match digest
- TournamentsSection with tournament cards

#### CirclesView (New Wrapper)
**Purpose:** Wrapper component for existing CirclesListView
**Props:**
- `conversations: ConversationItem[]`
- `loading: boolean`
- `error: string | null`
- `onOpenChat: (item: ConversationItem) => void`
- `onNewChat: (contactId: string, contactProfile: Profile) => void`
**Styling:**
- Flex: 1
- Display: flex
- Flex-direction: column
- Overflow: hidden

**Behavior:**
- Simply wraps CirclesListView with no modifications
- Passes through all props unchanged
- Preserves all existing circles functionality

#### Feed Component Reuse
All feed components are imported from `src/components/feed/`:
- `HeroSection`: Displays hero match with ELO tracking
- `ChallengesSection`: Lists incoming challenges
- `OpenMatchesSection`: Horizontal scrollable open matches
- `DigestSection`: Weekly match digest
- `TournamentsSection`: Active tournaments

These components are used as-is with no modifications, maintaining consistency with the feed-tab-redesign implementation.


## Data Models

### TypeScript Interfaces

```typescript
// Segment type
export type CirclesSegment = 'MATCHES' | 'CIRCLES';

// Feed data structure (from feed-api.ts)
export interface FeedData {
  heroMatch: FeedHeroMatch | null;
  challenges: FeedChallenge[];
  openMatches: FeedOpenMatch[];
  weeklyMatches: FeedDigestMatch[];
  tournaments: FeedTournament[];
}

// Scroll position tracking
interface ScrollPositions {
  MATCHES: number;
  CIRCLES: number;
}

// Enhanced CirclesPage state
interface CirclesPageState {
  // Existing
  screen: CirclesScreen;
  conversations: ConversationItem[];
  
  // New for redesign
  activeSegment: CirclesSegment;
  feedData: FeedData;
  feedLoading: boolean;
  feedError: Error | null;
  scrollPositions: ScrollPositions;
}
```

### Database Queries

The MATCHES view uses the same data fetching functions from `src/api/feed-api.ts`:

**Hero Match:**
```typescript
const heroMatch = await fetchHeroMatch(userId);
// Returns: FeedHeroMatch | null
```

**Challenges:**
```typescript
const challenges = await fetchChallenges(userId);
// Returns: FeedChallenge[]
```

**Open Matches:**
```typescript
const openMatches = await fetchOpenMatches(userId);
// Returns: FeedOpenMatch[]
```

**Weekly Matches:**
```typescript
const weeklyMatches = await fetchWeeklyMatches(userId);
// Returns: FeedDigestMatch[]
```

**Tournaments:**
```typescript
const tournaments = await fetchTournaments(userId);
// Returns: FeedTournament[]
```

All queries are executed in parallel using `Promise.all()` for optimal performance.


## State Management

### Component State

**CirclesPage State:**
```typescript
interface CirclesPageState {
  // Segment control
  activeSegment: CirclesSegment; // 'MATCHES' | 'CIRCLES'
  
  // Feed data (MATCHES view)
  feedData: FeedData;
  feedLoading: boolean;
  feedError: Error | null;
  
  // Scroll preservation
  scrollPositions: ScrollPositions;
  
  // Existing circles state
  screen: CirclesScreen; // 'list' | 'chat'
  conversations: ConversationItem[];
  conversationsLoading: boolean;
  conversationsError: string | null;
}
```

### State Updates

**Segment Change Flow:**
1. User taps segment button → `onSegmentChange` called
2. Save current scroll position for active view
3. Update `activeSegment` state
4. Restore scroll position for new view
5. If switching to MATCHES and no cached data, fetch feed data
6. Animate view transition (300ms)

**Feed Data Fetching Flow:**
1. Component mounts or MATCHES segment activated → check cache
2. If cached and fresh (< 5 min), use cached data
3. If not cached, set `feedLoading = true`
4. Fetch all feed data in parallel using `Promise.all()`
5. Transform raw database data to feed-specific types
6. Update `feedData` state
7. Set `feedLoading = false`
8. Cache data with timestamp

**Scroll Position Preservation:**
```typescript
// Save scroll position before switching
const saveScrollPosition = (segment: CirclesSegment, position: number) => {
  setScrollPositions(prev => ({
    ...prev,
    [segment]: position,
  }));
};

// Restore scroll position after switching
const restoreScrollPosition = (segment: CirclesSegment) => {
  const container = scrollContainerRef.current;
  if (container) {
    container.scrollTop = scrollPositions[segment];
  }
};
```

**Chat Navigation Flow (Existing):**
1. User opens chat → `setScreen({ view: 'chat', item })`
2. Hide segmented control
3. Hide bottom tab bar (via NavVisibilityContext)
4. Display ChatDetailView
5. User goes back → `setScreen({ view: 'list' })`
6. Show segmented control
7. Show bottom tab bar
8. Restore previous segment and scroll position


## API Integration

### Feed API Functions

The MATCHES view uses the existing feed API from `src/api/feed-api.ts`:

```typescript
import {
  fetchHeroMatch,
  fetchChallenges,
  fetchOpenMatches,
  fetchWeeklyMatches,
  fetchTournaments,
  getCachedData,
  setCachedData,
  type FeedData,
} from '@/api/feed-api';
```

**Parallel Data Fetching:**
```typescript
async function fetchAllFeedData(userId: string): Promise<FeedData> {
  // Check cache first
  const cachedData = getCachedData('all');
  if (cachedData) {
    return cachedData;
  }

  // Fetch data in parallel
  const [heroMatch, challenges, openMatches, weeklyMatches, tournaments] = 
    await Promise.all([
      fetchHeroMatch(userId),
      fetchChallenges(userId),
      fetchOpenMatches(userId),
      fetchWeeklyMatches(userId),
      fetchTournaments(userId),
    ]);

  const data: FeedData = {
    heroMatch,
    challenges,
    openMatches,
    weeklyMatches,
    tournaments,
  };

  // Cache for 5 minutes
  setCachedData('all', data);
  
  return data;
}
```

### Caching Strategy

**In-Memory Cache (from feed-api.ts):**
- Cache TTL: 5 minutes
- Max cache size: 5 entries
- LRU eviction policy
- Cache key: NewsFilter ('all' for MATCHES view)

**Cache Usage:**
```typescript
// On MATCHES view activation
useEffect(() => {
  if (activeSegment === 'MATCHES' && user) {
    const cached = getCachedData('all');
    if (cached) {
      setFeedData(cached);
      setFeedLoading(false);
    } else {
      fetchAllFeedData(user.id)
        .then(data => {
          setFeedData(data);
          setFeedLoading(false);
        })
        .catch(err => {
          setFeedError(err);
          setFeedLoading(false);
        });
    }
  }
}, [activeSegment, user]);
```

### Conversations API (Existing)

The CIRCLES view continues to use the existing `useConversations` hook:

```typescript
const { conversations, loading, error, markAsRead, refetch } = useConversations();
```

No changes to conversations data fetching or management.


## Styling Approach

### Design System Integration

The redesign uses the existing design system from `src/design-system/tokens/`:

**CSS Custom Properties:**
```css
/* Colors */
--color-bg: #F4F3EF
--color-surf: #FFFFFF
--color-surf-2: #F0EFEB
--color-t1: #14120E
--color-t2: #8A8880
--color-t3: #C2C0B8
--color-bdr: rgba(20,18,14,0.09)
--color-acc: #16D46A
--color-acc-dk: #0D9E50
--color-acc-bg: rgba(22,212,106,0.10)

/* Typography */
--font-body: 'Figtree', sans-serif
--font-display: 'Cormorant', serif

/* Radius */
--radius-sm: 8px
--radius-md: 10px
--radius-lg: 12px
--radius-full: 999px
```

### Component-Specific Styles

**SegmentedControl:**
```typescript
const segmentedControlStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-bdr)',
  padding: '8px 16px',
  display: 'flex',
  gap: 8,
};

const segmentButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 20px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: active ? 'var(--color-t1)' : 'var(--color-surf)',
  color: active ? '#fff' : 'var(--color-t2)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});
```

**View Container:**
```typescript
const viewContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};
```

**MatchesView Scroll Container:**
```typescript
const matchesScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  padding: '0 16px 80px',
};
```

### View Transition Animation

**Framer Motion Variants:**
```typescript
const viewVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const transition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};
```

**Usage:**
```typescript
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={activeSegment}
    custom={direction}
    variants={viewVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={transition}
  >
    {activeSegment === 'MATCHES' ? <MatchesView /> : <CirclesView />}
  </motion.div>
</AnimatePresence>
```


## Feed Tab Reversion

### Overview

The Feed/News tab will be reverted to display the previous gradient card news feed implementation. This involves:
1. Restoring the NewsPage component as the primary feed display
2. Removing feed system components from FeedPage
3. Updating route configuration to use NewsPage

### Implementation Steps

**1. Restore NewsPage as Primary Feed:**
```typescript
// In App.tsx or routing configuration
<Route path="/news" element={<NewsPage />} />
```

**2. Remove FeedPage (Optional):**
- FeedPage can be removed or kept for reference
- If kept, ensure it's not imported or used in routing

**3. NewsPage Component Structure:**
The existing `src/pages/news/NewsPage.tsx` displays:
- Greeting header with time-based message
- Gradient card feed items with categories:
  - Announcements
  - Match results
  - Ladder movements
  - Events
  - Achievements
  - Connection acceptances
- Interactive elements (like, comment, share)
- Category badges with colored accents

**4. Feed Item Types:**
```typescript
type FeedItemType = 
  | 'announcement' 
  | 'match_result' 
  | 'ladder_movement' 
  | 'event' 
  | 'achievement' 
  | 'connection_accepted';
```

**5. Gradient Card Styling:**
Each card uses dynamic gradients based on type:
- Events: Green gradient
- Match results: Green gradient (darker)
- Ladder movements: Purple gradient
- Default: Gray gradient

**6. Data Sources:**
- Mock data from `src/data/mock.ts`
- Real connection data from Supabase `connections` table
- Future: Additional feed items from `feed_items` table

### What to Remove

**From FeedPage (if removing):**
- All feed system component imports
- Feed data fetching logic
- SegmentStrip component usage
- Hero, Challenges, OpenMatches, Digest, Tournaments sections

**What to Keep:**
- Feed components in `src/components/feed/` (used by MATCHES view in Circles tab)
- Feed API functions in `src/api/feed-api.ts` (used by MATCHES view)
- Feed types in `src/types/feed.ts` (used by MATCHES view)

### Migration Checklist

- [ ] Update route to use NewsPage instead of FeedPage
- [ ] Verify NewsPage displays correctly with gradient cards
- [ ] Test connection acceptance feed items
- [ ] Ensure tab bar navigation works correctly
- [ ] Remove or archive FeedPage component
- [ ] Update any documentation referencing FeedPage


## Performance Considerations

### Initial Load Optimization

**Critical Rendering Path:**
1. Render segmented control immediately (< 100ms)
2. Default to MATCHES segment
3. Display skeleton loaders for feed content
4. Fetch feed data in parallel
5. Render sections progressively as data arrives

**Code Splitting:**
```typescript
// Lazy load feed sections (optional optimization)
const HeroSection = lazy(() => import('@/components/feed/HeroSection'));
const ChallengesSection = lazy(() => import('@/components/feed/ChallengesSection'));
const OpenMatchesSection = lazy(() => import('@/components/feed/OpenMatchesSection'));
const DigestSection = lazy(() => import('@/components/feed/DigestSection'));
const TournamentsSection = lazy(() => import('@/components/feed/TournamentsSection'));
```

### View Switching Optimization

**Scroll Position Preservation:**
```typescript
// Save scroll position before unmounting view
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    saveScrollPosition(activeSegment, container.scrollTop);
  };

  container.addEventListener('scroll', handleScroll);
  return () => container.removeEventListener('scroll', handleScroll);
}, [activeSegment]);

// Restore scroll position after mounting view
useEffect(() => {
  const container = scrollContainerRef.current;
  if (container) {
    container.scrollTop = scrollPositions[activeSegment];
  }
}, [activeSegment]);
```

**Debounced Segment Switching:**
```typescript
const debouncedSegmentChange = useMemo(
  () => debounce((segment: CirclesSegment) => {
    setActiveSegment(segment);
  }, 300),
  []
);
```

### Data Fetching Optimization

**Parallel Fetching:**
All feed data is fetched in parallel using `Promise.all()` to minimize wait time.

**Cache Strategy:**
- 5-minute TTL for feed data
- Immediate display of cached data
- Background refresh if cache is stale
- Fallback to cached data on network error

**Conditional Fetching:**
```typescript
// Only fetch feed data when MATCHES view is active
useEffect(() => {
  if (activeSegment === 'MATCHES' && user && !feedData.heroMatch) {
    fetchAllFeedData(user.id);
  }
}, [activeSegment, user]);
```

### Memory Management

**Cleanup:**
```typescript
useEffect(() => {
  const controller = new AbortController();

  if (activeSegment === 'MATCHES' && user) {
    fetchAllFeedData(user.id, controller.signal)
      .then(setFeedData)
      .catch(handleError);
  }

  return () => {
    controller.abort(); // Cancel pending requests on unmount
  };
}, [activeSegment, user]);
```

**Component Unmounting:**
- Clear scroll position listeners
- Abort pending fetch requests
- Preserve cached data for quick return


## Error Handling

### Error Categories

**Network Errors:**
- Failed database queries
- Timeout errors
- Connection loss

**Data Errors:**
- Missing required fields
- Invalid data formats
- Null/undefined values

**State Errors:**
- Invalid segment state
- Scroll position restoration failures

### Error Handling Strategy

**Graceful Degradation:**
```typescript
async function fetchFeedDataSafely(userId: string) {
  try {
    const data = await fetchAllFeedData(userId);
    return { data, error: null };
  } catch (error) {
    // Try to use cached data
    const cachedData = getCachedData('all');
    if (cachedData) {
      return {
        data: cachedData,
        error: new Error('Using cached data - network unavailable'),
      };
    }
    
    // No cache available
    return {
      data: null,
      error: error as Error,
    };
  }
}
```

**Error UI Components:**

**Network Error Banner:**
```typescript
function NetworkErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      background: 'var(--color-red-bg)',
      border: '1px solid var(--color-red)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      margin: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <p style={{ fontWeight: 600, color: 'var(--color-red)', marginBottom: 4 }}>
          Connection Error
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-t2)' }}>
          Showing cached data. Tap to retry.
        </p>
      </div>
      <button
        onClick={onRetry}
        style={{
          background: 'var(--color-red)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 16px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
```

**Empty State (MATCHES View):**
```typescript
function EmptyMatchesState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 80,
        height: 80,
        background: 'var(--color-surf)',
        border: '1px solid var(--color-bdr)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <TrophyIcon size={36} style={{ color: 'var(--color-t3)' }} />
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 700,
        color: 'var(--color-t1)',
        marginBottom: 8,
      }}>
        No activity yet
      </h3>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--color-t2)',
        maxWidth: 280,
        marginBottom: 24,
      }}>
        Play some matches and join tournaments to see your feed come to life.
      </p>
      <button style={{
        padding: '12px 28px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-acc)',
        color: '#fff',
        border: 'none',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 14,
        cursor: 'pointer',
      }}>
        Find Matches
      </button>
    </div>
  );
}
```

**Error Logging:**
```typescript
function logError(error: Error, context: string) {
  console.error(`[Circles Tab Error - ${context}]:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  // Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error, { tags: { context } });
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Segmented control display

*For any* page load, the segmented control should display two segments labeled "MATCHES" and "CIRCLES" at the top of the Circles tab.

**Validates: Requirements 1.1**

### Property 2: Default segment selection

*For any* initial page load, the segmented control should default to the "MATCHES" segment being active.

**Validates: Requirements 1.2**

### Property 3: Active segment visual indication

*For any* segment (MATCHES or CIRCLES), when that segment is active, it should display with dark background and white text, and when inactive, it should display with white background and gray text.

**Validates: Requirements 1.3**

### Property 4: Segment transition timing

*For any* segment tap, the view transition should complete within 300 milliseconds.

**Validates: Requirements 1.4**

### Property 5: Segmented control positioning

*For any* scroll position, the segmented control should remain fixed and visible at the top of the Circles tab.

**Validates: Requirements 1.6**

### Property 6: MATCHES view content display

*For any* MATCHES segment activation, the view should display the feed system content including hero match, challenges, open matches, digest, and tournaments sections.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 7: MATCHES view component reuse

*For any* feed section in MATCHES view, the section should use the existing feed components from the feed system without duplication.

**Validates: Requirements 2.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 8: MATCHES view data fetching

*For any* MATCHES view display, the view should fetch data using the existing feed API functions.

**Validates: Requirements 2.8, 6.1**

### Property 9: CIRCLES view content display

*For any* CIRCLES segment activation, the view should display the existing circles content including stories strip, user search, match proposals, and conversation list.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 10: CIRCLES view functionality preservation

*For any* social interaction feature in CIRCLES view, the feature should maintain all existing behavior from CirclesListView.

**Validates: Requirements 3.6, 3.7**

### Property 11: View transition animation

*For any* segment switch, the view transition should animate smoothly with appropriate easing curves.

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 12: Scroll position preservation per view

*For any* segment switch, the scroll position of the previous view should be saved and the scroll position of the new view should be restored.

**Validates: Requirements 4.3, 4.4**

### Property 13: Feed data caching

*For any* successfully fetched feed data, the system should cache the data for 5 minutes to minimize redundant requests.

**Validates: Requirements 6.2**

### Property 14: Cached data usage on view switch

*For any* switch from CIRCLES to MATCHES view, if cached data exists and is less than 5 minutes old, the system should use the cached data.

**Validates: Requirements 6.3**

### Property 15: Fresh data fetching

*For any* cached data older than 5 minutes, the system should fetch fresh data when MATCHES view is activated.

**Validates: Requirements 6.4**

### Property 16: Cache fallback on error

*For any* feed data fetching failure, if cached data exists, the system should display the cached data as fallback.

**Validates: Requirements 6.5**

### Property 17: Error state display

*For any* feed data fetching failure with no cached data, the system should display an appropriate error state.

**Validates: Requirements 6.6**

### Property 18: Empty state handling

*For any* feed section with no data, the section should display an appropriate empty state message.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

### Property 19: Chat navigation segmented control hiding

*For any* navigation to chat detail view, the segmented control should be hidden.

**Validates: Requirements 9.2**

### Property 20: Chat navigation segmented control restoration

*For any* return from chat detail view, the segmented control should be restored and display the previously active segment.

**Validates: Requirements 9.3, 9.4**

### Property 21: Chat navigation preservation

*For any* chat navigation action in CIRCLES view, the existing navigation patterns should be maintained.

**Validates: Requirements 9.1, 9.5**

### Property 22: Segment button touch target size

*For any* segment button, the touch target should be at least 44x44 points for accessibility.

**Validates: Requirements 10.2**

### Property 23: Segment button color contrast

*For any* segment button state (active or inactive), the button should use appropriate color contrast for readability.

**Validates: Requirements 10.3**

### Property 24: Segment button visual feedback

*For any* segment button tap, the button should provide visual feedback to indicate interaction.

**Validates: Requirements 10.1**

### Property 25: Keyboard accessibility

*For any* interactive element in the segmented control, the element should be keyboard accessible for users with assistive technologies.

**Validates: Requirements 10.4**

### Property 26: Screen reader announcements

*For any* segment change, the change should be announced to screen readers.

**Validates: Requirements 10.5**


## Testing Strategy

### Dual Testing Approach

The circles tab redesign will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty states, null values, boundary conditions)
- Error conditions (network failures, invalid data)
- Integration points between components
- User interaction flows (segment switches, scroll preservation)

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Validation of correctness properties defined in this document
- Each property test runs minimum 100 iterations

### Testing Framework

**Unit Testing:**
- Framework: Vitest
- React Testing: @testing-library/react
- User Interactions: @testing-library/user-event

**Property-Based Testing:**
- Library: fast-check (JavaScript/TypeScript property-based testing)
- Configuration: Minimum 100 iterations per property test
- Each test references its design document property

### Unit Test Examples

**SegmentedControl Rendering:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('should display MATCHES and CIRCLES segments', () => {
    render(
      <SegmentedControl 
        activeSegment="MATCHES" 
        onSegmentChange={() => {}} 
      />
    );
    
    expect(screen.getByText('MATCHES')).toBeInTheDocument();
    expect(screen.getByText('CIRCLES')).toBeInTheDocument();
  });

  it('should highlight active segment with dark background', () => {
    render(
      <SegmentedControl 
        activeSegment="MATCHES" 
        onSegmentChange={() => {}} 
      />
    );
    
    const matchesButton = screen.getByText('MATCHES');
    expect(matchesButton).toHaveStyle({ background: 'var(--color-t1)' });
  });

  it('should call onSegmentChange when segment is clicked', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <SegmentedControl 
        activeSegment="MATCHES" 
        onSegmentChange={handleChange} 
      />
    );
    
    await user.click(screen.getByText('CIRCLES'));
    expect(handleChange).toHaveBeenCalledWith('CIRCLES');
  });
});
```

**Scroll Position Preservation:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CirclesPage } from './CirclesPage';

describe('CirclesPage scroll preservation', () => {
  it('should save scroll position when switching segments', async () => {
    const { user, container } = render(<CirclesPage />);
    
    // Scroll MATCHES view
    const matchesView = container.querySelector('[data-view="matches"]');
    matchesView.scrollTop = 500;
    
    // Switch to CIRCLES
    await user.click(screen.getByText('CIRCLES'));
    
    // Switch back to MATCHES
    await user.click(screen.getByText('MATCHES'));
    
    // Verify scroll position restored
    expect(matchesView.scrollTop).toBe(500);
  });
});
```

**Feed Data Caching:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CirclesPage } from './CirclesPage';
import * as feedApi from '@/api/feed-api';

describe('CirclesPage feed data caching', () => {
  it('should use cached data when switching back to MATCHES', async () => {
    const fetchSpy = vi.spyOn(feedApi, 'fetchHeroMatch');
    const { user } = render(<CirclesPage />);
    
    // Wait for initial fetch
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    
    // Switch to CIRCLES
    await user.click(screen.getByText('CIRCLES'));
    
    // Switch back to MATCHES
    await user.click(screen.getByText('MATCHES'));
    
    // Should not fetch again (uses cache)
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
```


### Property-Based Test Examples

**Property Test Configuration:**
```typescript
import fc from 'fast-check';

// Configure fast-check for all tests
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations
  verbose: true,
});
```

**Property 1: Segmented control display**
```typescript
import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { SegmentedControl } from './SegmentedControl';

describe('Property-Based Tests', () => {
  it('Property 1: Segmented control display - Feature: circles-tab-redesign, Property 1: For any page load, the segmented control should display two segments labeled MATCHES and CIRCLES', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('MATCHES', 'CIRCLES'), // activeSegment
        (activeSegment) => {
          const { container } = render(
            <SegmentedControl
              activeSegment={activeSegment as any}
              onSegmentChange={() => {}}
            />
          );
          
          const matchesButton = screen.queryByText('MATCHES');
          const circlesButton = screen.queryByText('CIRCLES');
          
          // Property: both segments are always displayed
          return matchesButton !== null && circlesButton !== null;
        }
      )
    );
  });
});
```

**Property 3: Active segment visual indication**
```typescript
it('Property 3: Active segment visual indication - Feature: circles-tab-redesign, Property 3: For any segment, active segment should have dark background and inactive should have white background', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('MATCHES', 'CIRCLES'),
      (activeSegment) => {
        const { container } = render(
          <SegmentedControl
            activeSegment={activeSegment as any}
            onSegmentChange={() => {}}
          />
        );
        
        const matchesButton = screen.getByText('MATCHES');
        const circlesButton = screen.getByText('CIRCLES');
        
        const matchesStyle = window.getComputedStyle(matchesButton);
        const circlesStyle = window.getComputedStyle(circlesButton);
        
        // Property: active segment has dark background, inactive has white
        if (activeSegment === 'MATCHES') {
          return matchesStyle.background.includes('var(--color-t1)') &&
                 circlesStyle.background.includes('var(--color-surf)');
        } else {
          return circlesStyle.background.includes('var(--color-t1)') &&
                 matchesStyle.background.includes('var(--color-surf)');
        }
      }
    )
  );
});
```

**Property 12: Scroll position preservation per view**
```typescript
it('Property 12: Scroll position preservation - Feature: circles-tab-redesign, Property 12: For any segment switch, scroll position should be preserved', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 1000 }), // scroll position
      async (scrollPosition) => {
        const { user, container } = render(<CirclesPage />);
        
        // Set scroll position in MATCHES view
        const matchesView = container.querySelector('[data-view="matches"]');
        if (!matchesView) return false;
        
        matchesView.scrollTop = scrollPosition;
        
        // Switch to CIRCLES
        await user.click(screen.getByText('CIRCLES'));
        
        // Switch back to MATCHES
        await user.click(screen.getByText('MATCHES'));
        
        // Property: scroll position is restored
        return Math.abs(matchesView.scrollTop - scrollPosition) < 5; // Allow 5px tolerance
      }
    )
  );
});
```

**Property 13: Feed data caching**
```typescript
it('Property 13: Feed data caching - Feature: circles-tab-redesign, Property 13: For any successfully fetched feed data, data should be cached for 5 minutes', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        heroMatch: fc.option(fc.record({ id: fc.uuid() }), { nil: null }),
        challenges: fc.array(fc.record({ id: fc.uuid() })),
        openMatches: fc.array(fc.record({ id: fc.uuid() })),
        weeklyMatches: fc.array(fc.record({ id: fc.uuid() })),
        tournaments: fc.array(fc.record({ id: fc.uuid() })),
      }),
      async (feedData) => {
        const { setCachedData, getCachedData } = await import('@/api/feed-api');
        
        // Cache the data
        setCachedData('all', feedData as any);
        
        // Retrieve immediately
        const cached = getCachedData('all');
        
        // Property: cached data matches original data
        return JSON.stringify(cached) === JSON.stringify(feedData);
      }
    )
  );
});
```

**Property 14: Cached data usage on view switch**
```typescript
it('Property 14: Cached data usage - Feature: circles-tab-redesign, Property 14: For any switch to MATCHES with valid cache, cached data should be used', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.boolean(), // whether cache exists
      async (hasCachedData) => {
        const fetchSpy = vi.fn();
        vi.spyOn(feedApi, 'fetchHeroMatch').mockImplementation(fetchSpy);
        
        if (hasCachedData) {
          // Pre-populate cache
          setCachedData('all', mockFeedData);
        }
        
        const { user } = render(<CirclesPage />);
        
        // Start on CIRCLES
        await user.click(screen.getByText('CIRCLES'));
        
        // Switch to MATCHES
        await user.click(screen.getByText('MATCHES'));
        
        // Property: if cache exists, fetch should not be called
        if (hasCachedData) {
          return fetchSpy.mock.calls.length === 0;
        } else {
          return fetchSpy.mock.calls.length > 0;
        }
      }
    )
  );
});
```

### Test Coverage Goals

**Unit Tests:**
- Component rendering: 100% of new components (SegmentedControl, MatchesView, CirclesView)
- User interactions: All segment switches, scroll preservation, chat navigation
- Edge cases: Empty states, null values, boundary conditions
- Error handling: Network failures, invalid data, missing fields

**Property-Based Tests:**
- All 26 correctness properties defined in this document
- Each property test runs 100+ iterations
- Focus on state transitions, data caching, and scroll preservation

**Integration Tests:**
- Full circles page rendering with segmented control
- Segment switches with data fetching
- Error states with cache fallback
- Chat navigation with segment restoration

### Continuous Integration

**Pre-commit Hooks:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit && npm run test:properties"
    }
  }
}
```

**CI Pipeline:**
```yaml
# .github/workflows/test.yml
name: Test Circles Tab Redesign
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:properties
      - run: npm run test:coverage
```


## Implementation Roadmap

### Phase 1: Core Infrastructure (Priority: High)

**1.1 Create SegmentedControl Component**
- Create `src/components/circles/SegmentedControl.tsx`
- Implement segment button styling (active/inactive states)
- Add click handlers and accessibility attributes
- Write unit tests for component rendering and interactions

**1.2 Enhance CirclesPage State Management**
- Add `activeSegment` state ('MATCHES' | 'CIRCLES')
- Add `feedData` state for MATCHES view
- Add `scrollPositions` state for scroll preservation
- Add `feedLoading` and `feedError` states

**1.3 Create MatchesView Component**
- Create `src/pages/circles/MatchesView.tsx`
- Import feed components from `src/components/feed/`
- Implement scroll container with ref
- Add loading skeleton states
- Add empty state handling

**1.4 Create CirclesView Wrapper**
- Create `src/pages/circles/CirclesView.tsx`
- Wrap existing CirclesListView component
- Pass through all props unchanged
- Maintain existing functionality

### Phase 2: Data Integration (Priority: High)

**2.1 Integrate Feed API**
- Import feed API functions from `src/api/feed-api.ts`
- Implement parallel data fetching with Promise.all()
- Add error handling with try-catch
- Implement cache checking before fetch

**2.2 Implement Data Fetching Logic**
- Add useEffect for MATCHES segment activation
- Check cache before fetching
- Fetch data in parallel
- Update feedData state
- Handle loading and error states

**2.3 Add Cache Management**
- Use existing getCachedData and setCachedData functions
- Implement 5-minute TTL check
- Add cache fallback on error
- Clear cache on user logout

### Phase 3: View Switching (Priority: High)

**3.1 Implement Segment Switching**
- Add onSegmentChange handler
- Update activeSegment state
- Trigger view transition animation
- Fetch data if needed for MATCHES view

**3.2 Add Scroll Position Preservation**
- Create scroll container refs for both views
- Save scroll position before switching
- Restore scroll position after switching
- Add scroll event listeners

**3.3 Implement View Transitions**
- Add Framer Motion AnimatePresence
- Define view transition variants
- Configure transition timing (300ms)
- Add direction-based animations

### Phase 4: Feed Tab Reversion (Priority: Medium)

**4.1 Update Routing Configuration**
- Change `/news` route to use NewsPage
- Remove FeedPage from routing (or keep for reference)
- Verify tab bar navigation

**4.2 Test NewsPage Display**
- Verify gradient cards display correctly
- Test connection acceptance feed items
- Ensure interactive elements work (like, comment, share)
- Test empty state when no clubs joined

**4.3 Clean Up (Optional)**
- Archive or remove FeedPage component
- Update documentation
- Remove unused imports

### Phase 5: Error Handling & Edge Cases (Priority: Medium)

**5.1 Add Error UI Components**
- Create NetworkErrorBanner component
- Create EmptyMatchesState component
- Add error logging utility
- Implement retry functionality

**5.2 Handle Edge Cases**
- No feed data available
- Network timeout
- Invalid data formats
- Missing user profile
- Cache corruption

**5.3 Add Loading States**
- Skeleton loaders for feed sections
- Segment switch loading indicators
- Pull-to-refresh functionality (optional)

### Phase 6: Testing (Priority: High)

**6.1 Write Unit Tests**
- SegmentedControl component tests
- MatchesView component tests
- CirclesView wrapper tests
- Scroll preservation tests
- Data fetching tests

**6.2 Write Property-Based Tests**
- All 26 correctness properties
- 100+ iterations per property
- Reference design document properties
- Test state transitions and caching

**6.3 Integration Testing**
- Full page rendering tests
- Segment switching with data
- Chat navigation with restoration
- Error scenarios with fallbacks

### Phase 7: Accessibility & Polish (Priority: Low)

**7.1 Accessibility Enhancements**
- Add ARIA labels to segments
- Ensure keyboard navigation works
- Add screen reader announcements
- Test with assistive technologies

**7.2 Performance Optimization**
- Implement code splitting (optional)
- Add prefetching for adjacent segments
- Optimize image loading
- Reduce bundle size

**7.3 Visual Polish**
- Fine-tune transition animations
- Add haptic feedback (mobile)
- Improve loading states
- Add micro-interactions

### Phase 8: Documentation & Deployment (Priority: Low)

**8.1 Update Documentation**
- Document new component APIs
- Update architecture diagrams
- Add usage examples
- Document state management patterns

**8.2 Code Review & QA**
- Peer code review
- QA testing on multiple devices
- Performance profiling
- Accessibility audit

**8.3 Deployment**
- Merge to main branch
- Deploy to staging environment
- Monitor for errors
- Deploy to production


## Migration Guide

### For Developers

**Understanding the Changes:**
1. CirclesPage now has two views: MATCHES and CIRCLES
2. MATCHES view displays feed content (hero, challenges, open matches, digest, tournaments)
3. CIRCLES view wraps the existing CirclesListView (no changes to circles functionality)
4. Segmented control allows switching between views
5. Scroll positions are preserved when switching views
6. Feed data is cached for 5 minutes

**Key Files Modified:**
- `src/pages/circles/CirclesPage.tsx` - Enhanced with segmented control and MATCHES view
- `src/pages/circles/MatchesView.tsx` - New component for feed content
- `src/pages/circles/CirclesView.tsx` - New wrapper for CirclesListView
- `src/components/circles/SegmentedControl.tsx` - New segmented control component

**Key Files Unchanged:**
- `src/pages/circles/CirclesListView.tsx` - No changes to existing circles functionality
- `src/pages/circles/ChatDetailView.tsx` - No changes to chat functionality
- `src/components/circles/*` - All existing circles components unchanged
- `src/components/feed/*` - Feed components reused in MATCHES view

**Integration Points:**
- Feed API: `src/api/feed-api.ts` (existing, reused)
- Feed Components: `src/components/feed/` (existing, reused)
- Conversations Hook: `useConversations` (existing, unchanged)
- Auth Context: `useAuth` (existing, unchanged)

### For Users

**What's New:**
1. Circles tab now has two sections: MATCHES and CIRCLES
2. MATCHES section shows your match activity (results, challenges, open matches, tournaments)
3. CIRCLES section shows your social connections (same as before)
4. Tap the segment buttons at the top to switch between sections
5. Each section remembers your scroll position

**What's Changed:**
1. Feed/News tab now shows community news and announcements (gradient cards)
2. Match-related content moved from Feed tab to Circles tab (MATCHES section)

**What's the Same:**
1. All circles/messaging functionality works exactly as before
2. Chat conversations, stories, search, and match proposals unchanged
3. Navigation to chat details works the same way

### Troubleshooting

**Issue: Segmented control not displaying**
- Check that CirclesPage is properly imported and rendered
- Verify SegmentedControl component exists in `src/components/circles/`
- Check browser console for errors

**Issue: MATCHES view shows no data**
- Verify user is authenticated
- Check network tab for failed API requests
- Verify feed API functions are imported correctly
- Check cache status with getCachedData('all')

**Issue: Scroll position not preserved**
- Verify scroll container refs are properly attached
- Check that scroll event listeners are registered
- Verify scrollPositions state is being updated

**Issue: View transition animation stuttering**
- Check that Framer Motion is properly installed
- Verify AnimatePresence is wrapping the views
- Reduce animation complexity if performance is poor

**Issue: Feed tab showing wrong content**
- Verify routing configuration uses NewsPage for `/news`
- Check that FeedPage is not being imported in routing
- Clear browser cache and reload


## Appendix

### A. Component API Reference

#### SegmentedControl

```typescript
interface SegmentedControlProps {
  activeSegment: 'MATCHES' | 'CIRCLES';
  onSegmentChange: (segment: 'MATCHES' | 'CIRCLES') => void;
}

export function SegmentedControl({ 
  activeSegment, 
  onSegmentChange 
}: SegmentedControlProps): JSX.Element;
```

**Usage:**
```typescript
<SegmentedControl
  activeSegment={activeSegment}
  onSegmentChange={setActiveSegment}
/>
```

#### MatchesView

```typescript
interface MatchesViewProps {
  feedData: FeedData;
  loading: boolean;
  error: Error | null;
  onRefresh?: () => void;
}

export function MatchesView({ 
  feedData, 
  loading, 
  error, 
  onRefresh 
}: MatchesViewProps): JSX.Element;
```

**Usage:**
```typescript
<MatchesView
  feedData={feedData}
  loading={feedLoading}
  error={feedError}
  onRefresh={handleRefresh}
/>
```

#### CirclesView

```typescript
interface CirclesViewProps {
  conversations: ConversationItem[];
  loading: boolean;
  error: string | null;
  onOpenChat: (item: ConversationItem) => void;
  onNewChat: (contactId: string, contactProfile: Profile) => void;
}

export function CirclesView({ 
  conversations, 
  loading, 
  error, 
  onOpenChat, 
  onNewChat 
}: CirclesViewProps): JSX.Element;
```

**Usage:**
```typescript
<CirclesView
  conversations={conversations}
  loading={loading}
  error={error}
  onOpenChat={openChat}
  onNewChat={handleNewChat}
/>
```

### B. State Management Patterns

**Segment State:**
```typescript
const [activeSegment, setActiveSegment] = useState<'MATCHES' | 'CIRCLES'>('MATCHES');
```

**Feed Data State:**
```typescript
const [feedData, setFeedData] = useState<FeedData>({
  heroMatch: null,
  challenges: [],
  openMatches: [],
  weeklyMatches: [],
  tournaments: [],
});
const [feedLoading, setFeedLoading] = useState(true);
const [feedError, setFeedError] = useState<Error | null>(null);
```

**Scroll Position State:**
```typescript
const [scrollPositions, setScrollPositions] = useState<{
  MATCHES: number;
  CIRCLES: number;
}>({
  MATCHES: 0,
  CIRCLES: 0,
});
```

### C. Styling Reference

**Color Palette:**
```css
--color-bg: #F4F3EF        /* Background */
--color-surf: #FFFFFF      /* Surface/Card */
--color-surf-2: #F0EFEB    /* Secondary surface */
--color-t1: #14120E        /* Primary text */
--color-t2: #8A8880        /* Secondary text */
--color-t3: #C2C0B8        /* Tertiary text */
--color-bdr: rgba(20,18,14,0.09)  /* Border */
--color-acc: #16D46A       /* Accent green */
--color-acc-dk: #0D9E50    /* Dark accent */
--color-red: #E84040       /* Error red */
--color-red-bg: rgba(232,64,64,0.07)  /* Error background */
```

**Typography:**
```css
--font-body: 'Figtree', sans-serif
--font-display: 'Cormorant', serif
```

**Border Radius:**
```css
--radius-sm: 8px
--radius-md: 10px
--radius-lg: 12px
--radius-xl: 18px
--radius-2xl: 22px
--radius-full: 999px
```

### D. Performance Benchmarks

**Target Metrics:**
- Initial render: < 100ms
- Segment switch: < 300ms
- Feed data fetch: < 2s (parallel)
- Scroll restoration: < 50ms
- Cache lookup: < 10ms

**Optimization Techniques:**
- Parallel data fetching with Promise.all()
- 5-minute cache TTL
- Scroll position preservation
- Component memoization (React.memo)
- Lazy loading for modals
- Debounced segment switches

### E. Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Required Features:**
- CSS Custom Properties
- Flexbox
- CSS Grid
- Intersection Observer (for lazy loading)
- Local Storage (for cache)
- Fetch API
- Promises
- Async/Await

### F. Related Documentation

**Design Documents:**
- Feed Tab Redesign: `.kiro/specs/feed-tab-redesign/design.md`
- Circles Tab Requirements: `.kiro/specs/circles-tab-redesign/requirements.md`

**Component Documentation:**
- Feed Components: `src/components/feed/README.md`
- Circles Components: `src/components/circles/`

**API Documentation:**
- Feed API: `src/api/feed-api.ts`
- Supabase Client: `src/lib/supabase.ts`

**Type Definitions:**
- Feed Types: `src/types/feed.ts`
- Circles Types: `src/types/circles.ts`
- Database Types: `src/types/database.ts`


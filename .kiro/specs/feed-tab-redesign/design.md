# Design Document: Feed Tab Redesign

## Overview

The Feed Tab Redesign transforms the current single-column gradient card feed into a modern, segmented feed with multiple content sections. The new design emphasizes visual hierarchy, content categorization, and improved user engagement through specialized card types and horizontal scrolling sections.

The redesign replaces `src/pages/news/NewsPage.tsx` with a new `FeedPage` component that displays:
- A hero highlight card showing the user's latest match result with ELO rating changes
- Incoming match challenges requiring user response
- Open matches available to join in a horizontal scrollable strip
- Weekly match digest showing recent performance
- Nearby tournaments with entry options

The feed integrates with existing database tables (`matches`, `challenges`, `feed_items`, `competitions`, `profiles`) and follows the established design system patterns using CSS custom properties and inline styles.

## Architecture

### System Integration

The Feed system integrates into the existing GotGetGo application architecture:

```
App.tsx (BrowserRouter)
  └─ AuthProvider
      └─ FilterProvider
          └─ AppShell
              └─ FeedPage (replaces NewsPage)
```

**Route Configuration:**
- Path: `/news` (maintains existing route for backward compatibility)
- Access: `GuestRoute` (accessible to authenticated users and guests)
- Navigation: Accessible via bottom tab bar "Feed" tab

**Context Dependencies:**
- `AuthContext`: Provides current user information for personalized content
- `FilterContext`: Manages feed filter state (newsFilter property)
- `NavVisibilityContext`: Controls header/tab bar visibility during scroll

### Data Flow

```
FeedPage Component
  ├─ useAuth() → current user
  ├─ useFilters() → active filter state
  ├─ useState() → feed data, loading states
  └─ useEffect() → data fetching on mount/filter change
      ├─ fetchLatestMatch() → Hero card data
      ├─ fetchChallenges() → Challenge cards
      ├─ fetchOpenMatches() → Open match cards
      ├─ fetchWeeklyMatches() → Digest card
      └─ fetchTournaments() → Tournament cards
```

**State Management:**
- Local component state for feed data (no global state needed)
- Loading states for skeleton UI during data fetch
- Error states for graceful degradation
- Filter state managed by existing FilterContext

### Performance Strategy

**Initial Load:**
1. Render header and segment strip immediately (< 100ms)
2. Display skeleton loaders for content sections
3. Fetch data in parallel using Promise.all()
4. Render sections as data arrives (progressive rendering)

**Optimization Techniques:**
- Lazy load images with Intersection Observer
- Virtual scrolling for feeds > 50 items (not needed for initial MVP)
- Debounce filter changes (300ms)
- Cache feed data in memory for 5 minutes
- Prefetch adjacent filter data on hover

## Components and Interfaces

### Component Hierarchy

```
FeedPage
├─ FeedHeader
│   ├─ Logo
│   ├─ ContextPill ("Feed")
│   ├─ SearchButton
│   ├─ NotificationButton
│   └─ AvatarButton
├─ SegmentStrip
│   └─ SegmentPill[] (All, Challenges, Results, Near Me, Tournaments)
├─ FeedContent (scrollable)
│   ├─ HeroSection (conditional)
│   │   ├─ SectionHeader
│   │   ├─ HeroCard
│   │   └─ ELOStrip
│   ├─ ChallengesSection (conditional)
│   │   ├─ SectionHeader
│   │   └─ ChallengeCard[]
│   ├─ OpenMatchesSection (conditional)
│   │   ├─ SectionHeader
│   │   └─ HorizontalScroll
│   │       └─ OpenMatchCard[]
│   ├─ DigestSection (conditional)
│   │   ├─ SectionHeader
│   │   └─ DigestCard
│   │       └─ DigestRow[]
│   ├─ TournamentsSection (conditional)
│   │   ├─ SectionHeader
│   │   └─ TournamentCard[]
│   └─ EmptyState (conditional)
└─ (AppShell provides TabBar)
```

### Component Specifications

#### FeedPage
**Purpose:** Root container managing data fetching, filtering, and layout
**Props:** None (uses contexts)
**State:**
- `heroMatch: Match | null`
- `challenges: Challenge[]`
- `openMatches: Challenge[]`
- `weeklyMatches: Match[]`
- `tournaments: Competition[]`
- `loading: boolean`
- `error: Error | null`

#### FeedHeader
**Purpose:** Top navigation bar with branding and actions
**Props:**
- `onSearchClick: () => void`
- `onNotificationClick: () => void`
- `onAvatarClick: () => void`
- `hasNotifications: boolean`
**Styling:**
- Fixed height: 52px
- Background: `var(--color-bg)`
- Padding: 0 22px

#### SegmentStrip
**Purpose:** Horizontal scrollable filter bar
**Props:**
- `activeFilter: NewsFilter`
- `onFilterChange: (filter: NewsFilter) => void`
**Styling:**
- Horizontal scroll with hidden scrollbar
- Right-edge fade gradient
- Pills: 30px height, 13px horizontal padding

#### HeroCard
**Purpose:** Prominent display of latest match result
**Props:**
- `match: Match`
- `opponent: Profile`
- `club: Club | null`
- `eloChange: number`
- `onShareClick: () => void`
- `onOptionsClick: () => void`
**Styling:**
- Dark background with radial green glow
- Top radius: 22px, bottom: 0 (connects to ELO strip)
- Padding: 20px

#### ELOStrip
**Purpose:** Rating change display attached to hero card
**Props:**
- `eloChange: number`
- `currentElo: number`
- `sparklineData: number[]`
**Styling:**
- Background: `var(--color-surf-2)`
- Bottom radius: 18px, top: 0
- Border: 1px solid `var(--color-bdr)` (no top border)

#### ChallengeCard
**Purpose:** Individual challenge display with response action
**Props:**
- `challenge: Challenge`
- `challenger: Profile`
- `onRespondClick: () => void`
**Styling:**
- White background with shadow
- Border radius: 16px
- Padding: 13px 14px
- Margin bottom: 8px

#### OpenMatchCard
**Purpose:** Compact match card in horizontal scroll
**Props:**
- `challenge: Challenge`
- `host: Profile`
- `onJoinClick: () => void`
**Styling:**
- Fixed width: 148px
- White background with shadow
- Border radius: 18px
- Padding: 14px

#### DigestCard
**Purpose:** Multi-row weekly match summary
**Props:**
- `matches: Match[]`
**Children:** DigestRow[]
**Styling:**
- White background with shadow
- Border radius: 18px
- Rows separated by borders

#### DigestRow
**Purpose:** Single match entry in digest
**Props:**
- `match: Match`
- `opponent: Profile`
- `isWin: boolean`
**Styling:**
- Padding: 12px 16px
- Border top: 1px solid `var(--color-bdr)` (except first)

#### TournamentCard
**Purpose:** Tournament display with entry action
**Props:**
- `tournament: Competition`
- `onEnterClick: () => void`
**Styling:**
- White background with shadow
- Border radius: 16px
- Padding: 12px 16px
- Margin bottom: 8px

#### SectionHeader
**Purpose:** Label and link for content sections
**Props:**
- `label: string`
- `linkText?: string`
- `onLinkClick?: () => void`
**Styling:**
- Label: 9px, uppercase, wide letter spacing
- Link: 12px, green accent color

## Data Models

### TypeScript Interfaces

```typescript
// Feed-specific types
export type NewsFilter = 'all' | 'challenges' | 'results' | 'near_me' | 'tournaments';

export interface FeedHeroMatch {
  match: Match;
  opponent: Profile;
  club: Club | null;
  eloChange: number;
  currentElo: number;
  sparklineData: number[];
}

export interface FeedChallenge {
  challenge: Challenge;
  challenger: Profile;
  players: Profile[];
  isNew: boolean;
  distance: number;
}

export interface FeedOpenMatch {
  challenge: Challenge;
  host: Profile;
  distance: number;
}

export interface FeedDigestMatch {
  match: Match;
  opponent: Profile;
  club: Club | null;
  isWin: boolean;
}

export interface FeedTournament {
  competition: Competition;
  club: Club;
  spotsLeft: number;
}

// Extended database types
export interface MatchWithPlayers extends Match {
  players: Profile[];
  club?: Club;
}

export interface ChallengeWithPlayers extends Challenge {
  proposer: Profile;
  players: Profile[];
  club?: Club;
}
```

### Database Queries

**Latest Match (Hero Card):**
```typescript
const { data: matches } = await supabase
  .from('matches')
  .select(`
    *,
    club:clubs(*),
    match_players!inner(
      user:profiles(*)
    )
  `)
  .eq('match_players.user_id', userId)
  .eq('score_status', 'confirmed')
  .order('played_at', { ascending: false })
  .limit(1);
```

**Incoming Challenges:**
```typescript
const { data: challenges } = await supabase
  .from('challenges')
  .select(`
    *,
    proposer:profiles!proposed_by(*),
    challenge_players!inner(
      user:profiles(*),
      team_number
    ),
    club:clubs(*)
  `)
  .eq('challenge_players.user_id', userId)
  .neq('proposed_by', userId)
  .in('status', ['proposed', 'accepted'])
  .order('created_at', { ascending: false });
```

**Open Matches:**
```typescript
const { data: openMatches } = await supabase
  .from('challenges')
  .select(`
    *,
    proposer:profiles!proposed_by(*),
    club:clubs(*)
  `)
  .eq('is_open', true)
  .eq('status', 'proposed')
  .order('confirmed_time', { ascending: true })
  .limit(10);
```

**Weekly Matches:**
```typescript
const weekAgo = new Date();
weekAgo.setDate(weekAgo.getDate() - 7);

const { data: weeklyMatches } = await supabase
  .from('matches')
  .select(`
    *,
    club:clubs(*),
    match_players!inner(
      user:profiles(*)
    )
  `)
  .eq('match_players.user_id', userId)
  .eq('score_status', 'confirmed')
  .gte('played_at', weekAgo.toISOString())
  .order('played_at', { ascending: false });
```

**Nearby Tournaments:**
```typescript
const { data: tournaments } = await supabase
  .from('competitions')
  .select(`
    *,
    club:clubs(*),
    participants:competition_participants(count)
  `)
  .eq('is_active', true)
  .eq('competition_type', 'tournament')
  .gte('registration_deadline', new Date().toISOString())
  .order('start_date', { ascending: true })
  .limit(5);
```

### Data Transformations

**ELO Calculation:**
```typescript
function calculateEloChange(match: Match, userId: string): number {
  // Simplified K-factor calculation
  const K = 32;
  const playerTeam = match.match_players.find(p => p.user_id === userId)?.team_number;
  const isWinner = match.winner_team === playerTeam;
  
  // Calculate expected score based on opponent rating
  // Return positive for win, negative for loss
  return isWinner ? 14 : -12; // Placeholder logic
}
```

**Distance Calculation:**
```typescript
function calculateDistance(
  userLat: number,
  userLng: number,
  venueLat: number,
  venueLng: number
): number {
  // Haversine formula
  const R = 3959; // Earth radius in miles
  const dLat = (venueLat - userLat) * Math.PI / 180;
  const dLng = (venueLng - userLng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(venueLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}
```

**Relative Time Formatting:**
```typescript
function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}
```


## State Management

### Component State

**FeedPage State:**
```typescript
interface FeedPageState {
  // Data
  heroMatch: FeedHeroMatch | null;
  challenges: FeedChallenge[];
  openMatches: FeedOpenMatch[];
  weeklyMatches: FeedDigestMatch[];
  tournaments: FeedTournament[];
  
  // UI State
  loading: boolean;
  error: Error | null;
  
  // Cache
  lastFetch: number;
  cachedData: Map<NewsFilter, FeedData>;
}
```

**Filter State (from FilterContext):**
```typescript
interface FilterState {
  newsFilter: NewsFilter; // 'all' | 'challenges' | 'results' | 'near_me' | 'tournaments'
}
```

### State Updates

**Data Fetching Flow:**
1. User navigates to feed → `useEffect` triggers
2. Set `loading = true`
3. Fetch data in parallel using `Promise.all()`
4. Transform raw database data to feed-specific types
5. Update state with fetched data
6. Set `loading = false`
7. Cache data with timestamp

**Filter Change Flow:**
1. User clicks segment pill → `onFilterChange` called
2. Update `newsFilter` in FilterContext (debounced 300ms)
3. Check cache for filter data
4. If cached and fresh (< 5 min), use cached data
5. If not cached, fetch data for filter
6. Update displayed content

**Error Handling Flow:**
1. Data fetch fails → catch error
2. Check cache for stale data
3. If cache exists, display cached data + warning banner
4. If no cache, set `error` state and display error UI
5. Provide retry button

## API Integration

### Supabase Client

The feed uses the existing Supabase client from `src/lib/supabase.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
```

### Data Fetching Functions

**fetchHeroMatch:**
```typescript
async function fetchHeroMatch(userId: string): Promise<FeedHeroMatch | null> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      club:clubs(*),
      match_players!inner(
        user:profiles(*),
        team_number
      )
    `)
    .eq('match_players.user_id', userId)
    .eq('score_status', 'confirmed')
    .order('played_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !matches) return null;

  // Find opponent
  const opponent = matches.match_players.find(
    p => p.user.id !== userId
  )?.user;

  // Calculate ELO change
  const eloChange = calculateEloChange(matches, userId);
  
  // Get current ELO from user profile
  const { data: profile } = await supabase
    .from('user_sport_profiles')
    .select('official_rating')
    .eq('user_id', userId)
    .eq('sport', matches.sport)
    .single();

  const currentElo = parseInt(profile?.official_rating || '1200');

  // Generate sparkline data (last 10 matches)
  const sparklineData = await generateSparklineData(userId, matches.sport);

  return {
    match: matches,
    opponent: opponent!,
    club: matches.club,
    eloChange,
    currentElo,
    sparklineData,
  };
}
```

**fetchChallenges:**
```typescript
async function fetchChallenges(userId: string): Promise<FeedChallenge[]> {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select(`
      *,
      proposer:profiles!proposed_by(*),
      challenge_players!inner(
        user:profiles(*),
        team_number
      ),
      club:clubs(*)
    `)
    .eq('challenge_players.user_id', userId)
    .neq('proposed_by', userId)
    .in('status', ['proposed', 'accepted'])
    .order('created_at', { ascending: false });

  if (error || !challenges) return [];

  // Get user location for distance calculation
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('location_lat, location_lng')
    .eq('id', userId)
    .single();

  return challenges.map(challenge => {
    const distance = userProfile && challenge.club
      ? calculateDistance(
          userProfile.location_lat!,
          userProfile.location_lng!,
          challenge.club.location_lat!,
          challenge.club.location_lng!
        )
      : 0;

    // Check if challenge is new (created within last 24 hours)
    const createdAt = new Date(challenge.created_at);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / 3600000;
    const isNew = hoursSinceCreated < 24;

    return {
      challenge,
      challenger: challenge.proposer,
      players: challenge.challenge_players.map(cp => cp.user),
      isNew,
      distance,
    };
  });
}
```

**fetchOpenMatches:**
```typescript
async function fetchOpenMatches(userId: string): Promise<FeedOpenMatch[]> {
  const { data: openMatches, error } = await supabase
    .from('challenges')
    .select(`
      *,
      proposer:profiles!proposed_by(*),
      club:clubs(*)
    `)
    .eq('is_open', true)
    .eq('status', 'proposed')
    .order('confirmed_time', { ascending: true })
    .limit(10);

  if (error || !openMatches) return [];

  // Get user location
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('location_lat, location_lng')
    .eq('id', userId)
    .single();

  return openMatches.map(match => {
    const distance = userProfile && match.club
      ? calculateDistance(
          userProfile.location_lat!,
          userProfile.location_lng!,
          match.club.location_lat!,
          match.club.location_lng!
        )
      : 0;

    return {
      challenge: match,
      host: match.proposer,
      distance,
    };
  });
}
```

**fetchWeeklyMatches:**
```typescript
async function fetchWeeklyMatches(userId: string): Promise<FeedDigestMatch[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      club:clubs(*),
      match_players!inner(
        user:profiles(*),
        team_number
      )
    `)
    .eq('match_players.user_id', userId)
    .eq('score_status', 'confirmed')
    .gte('played_at', weekAgo.toISOString())
    .order('played_at', { ascending: false });

  if (error || !matches) return [];

  return matches.map(match => {
    const userTeam = match.match_players.find(p => p.user.id === userId)?.team_number;
    const isWin = match.winner_team === userTeam;
    const opponent = match.match_players.find(p => p.user.id !== userId)?.user;

    return {
      match,
      opponent: opponent!,
      club: match.club,
      isWin,
    };
  });
}
```

**fetchTournaments:**
```typescript
async function fetchTournaments(userId: string): Promise<FeedTournament[]> {
  const { data: tournaments, error } = await supabase
    .from('competitions')
    .select(`
      *,
      club:clubs(*),
      participants:competition_participants(count)
    `)
    .eq('is_active', true)
    .eq('competition_type', 'tournament')
    .gte('registration_deadline', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(5);

  if (error || !tournaments) return [];

  return tournaments.map(tournament => {
    const participantCount = tournament.participants?.[0]?.count || 0;
    const spotsLeft = tournament.max_participants
      ? tournament.max_participants - participantCount
      : 0;

    return {
      competition: tournament,
      club: tournament.club,
      spotsLeft,
    };
  });
}
```

### Caching Strategy

**In-Memory Cache:**
```typescript
interface CacheEntry {
  data: FeedData;
  timestamp: number;
  filter: NewsFilter;
}

const feedCache = new Map<NewsFilter, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData(filter: NewsFilter): FeedData | null {
  const entry = feedCache.get(filter);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    feedCache.delete(filter);
    return null;
  }
  
  return entry.data;
}

function setCachedData(filter: NewsFilter, data: FeedData): void {
  feedCache.set(filter, {
    data,
    timestamp: Date.now(),
    filter,
  });
}
```

## Styling Approach

### Design System Integration

The feed uses the existing design system from `src/design-system/tokens/`:

**CSS Custom Properties:**
```css
/* From colors.css */
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
--color-red: #E84040
--color-red-bg: rgba(232,64,64,0.07)

/* From typography */
--font-body: 'Figtree', sans-serif
--font-display: 'Cormorant', serif

/* From radius */
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 18px
--radius-2xl: 22px
```

### Inline Styles Pattern

Following the existing codebase pattern (see `NewsPage.tsx`, `DiscoveryCard.tsx`), components use inline styles with CSS custom properties:

```typescript
<div style={{
  background: 'var(--color-surf)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-bdr)',
  boxShadow: '0 1px 4px rgba(20,18,14,0.06), 0 6px 20px rgba(20,18,14,0.07)',
  padding: '13px 14px',
}}>
  {/* Card content */}
</div>
```

### Component-Specific Styles

**Hero Card Gradient:**
```typescript
const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  background: 'var(--color-t1)',
  borderRadius: '22px 22px 0 0',
  padding: '20px 20px 18px',
  overflow: 'hidden',
};

const heroGlowStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'radial-gradient(ellipse at 80% 0%, rgba(22,212,106,0.18) 0%, transparent 60%)',
  zIndex: 0,
  pointerEvents: 'none',
};
```

**Horizontal Scroll with Fade:**
```typescript
const horizontalScrollContainerStyle: React.CSSProperties = {
  position: 'relative',
  margin: '0 -16px',
  padding: '0 16px',
};

const horizontalScrollStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
  paddingBottom: 4,
  paddingRight: 32,
};

const fadeIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 4,
  width: 48,
  background: 'linear-gradient(to right, transparent, var(--color-bg))',
  pointerEvents: 'none',
  zIndex: 2,
};
```

### Responsive Behavior

**Mobile-First Approach:**
- Base styles optimized for 390px viewport (iPhone 14 Pro)
- No media queries needed for initial implementation
- Touch-optimized tap targets (minimum 44x44px)
- Momentum scrolling enabled with `-webkit-overflow-scrolling: touch`

**Scroll Behavior:**
- Vertical scroll: Main feed container
- Horizontal scroll: Segment strip, open matches section
- Hidden scrollbars: `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`
- Smooth scrolling: `scroll-behavior: smooth` on containers

### Accessibility Considerations

**Semantic HTML:**
- Use `<button>` for interactive elements
- Use `<nav>` for segment strip
- Use proper heading hierarchy (`<h1>`, `<h2>`, `<h3>`)

**ARIA Labels:**
```typescript
<button
  aria-label="Search"
  onClick={onSearchClick}
>
  <SearchIcon />
</button>

<button
  aria-label={`Notifications${hasNotifications ? ' - You have new notifications' : ''}`}
  onClick={onNotificationClick}
>
  <BellIcon />
  {hasNotifications && <span className="notification-dot" aria-hidden="true" />}
</button>
```

**Keyboard Navigation:**
- All interactive elements focusable
- Focus visible styles using `:focus-visible`
- Tab order follows visual order

## Performance Considerations

### Initial Load Optimization

**Critical Rendering Path:**
1. Render header immediately (< 100ms)
2. Render segment strip with selected filter
3. Display skeleton loaders for content sections
4. Fetch data in parallel
5. Render sections progressively as data arrives

**Code Splitting:**
```typescript
// Lazy load modals
const ShareModal = lazy(() => import('@/components/feed/ShareModal'));
const ChallengeResponseModal = lazy(() => import('@/components/feed/ChallengeResponseModal'));
const JoinMatchModal = lazy(() => import('@/components/feed/JoinMatchModal'));
```

### Image Optimization

**Lazy Loading:**
```typescript
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isVisible ? src : undefined}
      alt={alt}
      loading="lazy"
    />
  );
}
```

### Data Fetching Optimization

**Parallel Fetching:**
```typescript
async function fetchAllFeedData(userId: string, filter: NewsFilter) {
  const [heroMatch, challenges, openMatches, weeklyMatches, tournaments] = 
    await Promise.all([
      filter === 'all' || filter === 'results' ? fetchHeroMatch(userId) : null,
      filter === 'all' || filter === 'challenges' ? fetchChallenges(userId) : [],
      filter === 'all' || filter === 'near_me' ? fetchOpenMatches(userId) : [],
      filter === 'all' || filter === 'results' ? fetchWeeklyMatches(userId) : [],
      filter === 'all' || filter === 'tournaments' ? fetchTournaments(userId) : [],
    ]);

  return { heroMatch, challenges, openMatches, weeklyMatches, tournaments };
}
```

**Debounced Filter Changes:**
```typescript
const debouncedFilterChange = useMemo(
  () => debounce((filter: NewsFilter) => {
    updateFilters({ ...filters, newsFilter: filter });
  }, 300),
  [filters, updateFilters]
);
```

**Prefetching:**
```typescript
function prefetchFilterData(filter: NewsFilter) {
  // Prefetch on hover/focus
  const cachedData = getCachedData(filter);
  if (!cachedData) {
    fetchAllFeedData(user.id, filter).then(data => {
      setCachedData(filter, data);
    });
  }
}
```

### Virtual Scrolling

For feeds with > 50 items, implement virtual scrolling:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualFeedList({ items }: { items: FeedItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated item height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <FeedCard item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Memory Management

**Cleanup:**
```typescript
useEffect(() => {
  const controller = new AbortController();

  fetchAllFeedData(user.id, activeFilter, controller.signal)
    .then(setFeedData)
    .catch(handleError);

  return () => {
    controller.abort(); // Cancel pending requests on unmount
  };
}, [user.id, activeFilter]);
```

**Cache Limits:**
```typescript
const MAX_CACHE_SIZE = 5; // Store max 5 filter states

function setCachedData(filter: NewsFilter, data: FeedData): void {
  if (feedCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const oldestKey = Array.from(feedCache.keys())[0];
    feedCache.delete(oldestKey);
  }
  
  feedCache.set(filter, {
    data,
    timestamp: Date.now(),
    filter,
  });
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Notification indicator visibility

*For any* notification state (has notifications or no notifications), the notification bell icon should display a green dot indicator if and only if notifications exist.

**Validates: Requirements 1.4**

### Property 2: Filter selection styling

*For any* segment filter option, when that filter is selected, it should display with dark background and light text, and when not selected, it should display with white background and gray text.

**Validates: Requirements 2.3, 2.4**

### Property 3: Content filtering

*For any* selected filter and any set of feed items, the displayed content should include only items that match the selected filter category.

**Validates: Requirements 2.7**

### Property 4: Hero card eyebrow formatting

*For any* match result, the hero card eyebrow label should contain the sport name and relative time formatted correctly.

**Validates: Requirements 3.2**

### Property 5: Hero card headline formatting

*For any* match result, the hero card headline should display the opponent name in italic green accent color.

**Validates: Requirements 3.3**

### Property 6: Hero card venue display

*For any* match with venue information, the hero card should display the venue details as subtitle text.

**Validates: Requirements 3.5**

### Property 7: Hero card pill badges

*For any* match result, the hero card should include pill badges showing time elapsed, ELO change with indicator, and location.

**Validates: Requirements 3.6**

### Property 8: ELO change sign indicator

*For any* ELO change value (positive or negative), the ELO strip should display the value with the correct plus or minus indicator.

**Validates: Requirements 4.3**

### Property 9: ELO current rating display

*For any* user with a rating, the ELO strip should display the current total rating value.

**Validates: Requirements 4.4**

### Property 10: Challenge card avatar initials

*For any* player name, the challenge card avatar should display the correct initials derived from the player's name.

**Validates: Requirements 5.2**

### Property 11: Challenge card player information

*For any* challenge, the challenge card should display the player name, sport, ELO rating, and distance.

**Validates: Requirements 5.3**

### Property 12: Challenge new badge display

*For any* challenge, the challenge card should display a "New" badge in green accent color if and only if the challenge was created within the last 24 hours.

**Validates: Requirements 5.5**

### Property 13: Open match card avatar initials

*For any* player name, the open match card avatar should display the correct initials derived from the player's name.

**Validates: Requirements 6.2**

### Property 14: Open match card player name

*For any* open match, the card should display the host player's name.

**Validates: Requirements 6.3**

### Property 15: Open match card sport badge

*For any* open match, the card should display the sport as a green pill badge.

**Validates: Requirements 6.4**

### Property 16: Open match card details

*For any* open match, the card should display date, time, and distance details.

**Validates: Requirements 6.5**

### Property 17: Digest card multiple rows

*For any* set of weekly matches, the digest card should display all matches as separate rows within a single card container.

**Validates: Requirements 7.1**

### Property 18: Digest card win/loss badges

*For any* match in the digest, the card should display a green "W" badge if the match was won, and a red "L" badge if the match was lost.

**Validates: Requirements 7.2, 7.3**

### Property 19: Digest card match information

*For any* match in the digest, the row should display opponent name, venue details, match score, and time/date.

**Validates: Requirements 7.4, 7.5**

### Property 20: Tournament card name display

*For any* tournament, the tournament card should display the tournament name.

**Validates: Requirements 8.3**

### Property 21: Tournament card details display

*For any* tournament, the tournament card should display dates, player count, and skill level information.

**Validates: Requirements 8.4**

### Property 22: Section header link display

*For any* content section, the section header should include a right-aligned link if and only if additional content is available beyond what is currently displayed.

**Validates: Requirements 9.3**

### Property 23: Empty section hiding

*For any* feed section (highlights, challenges, open matches, weekly matches, tournaments), the section should be hidden if and only if no data exists for that section.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

### Property 24: Database query execution

*For any* user viewing the feed, the system should execute database queries to fetch match results, challenges, open matches, and tournaments.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 25: ELO calculation

*For any* match result with player ratings, the system should calculate the ELO change based on the match outcome and opponent rating.

**Validates: Requirements 13.5**

### Property 26: Distance calculation

*For any* pair of coordinates (user location and venue location), the system should calculate the distance in miles using the Haversine formula.

**Validates: Requirements 13.6**

### Property 27: Relative time formatting

*For any* timestamp, the system should format it as relative time (e.g., "2h ago", "Today", "Yesterday") based on the time difference from now.

**Validates: Requirements 13.7**

### Property 28: Error handling with cache fallback

*For any* data fetching failure, if cached data exists, the system should display the cached data; if no cache exists, the system should display an error state.

**Validates: Requirements 13.8, 13.9**

### Property 29: Header render performance

*For any* page load, the header component should render and display within 100 milliseconds.

**Validates: Requirements 15.1**

### Property 30: Loading state display

*For any* data fetching operation, the system should display skeleton loading states while the data is being fetched.

**Validates: Requirements 15.2**

### Property 31: Image lazy loading

*For any* image in the feed, the image should be loaded only when it enters or is about to enter the viewport.

**Validates: Requirements 15.3**

### Property 32: Feed data caching

*For any* successfully fetched feed data, the system should cache the data for offline viewing with a timestamp.

**Validates: Requirements 15.4**

### Property 33: Virtual scrolling activation

*For any* feed with more than 50 items, the system should implement virtual scrolling to render only visible items.

**Validates: Requirements 15.5**

### Property 34: Filter change debouncing

*For any* rapid sequence of filter changes, the system should debounce the changes by 300ms before executing the filter update.

**Validates: Requirements 15.6**

### Property 35: Adjacent filter prefetching

*For any* filter option that receives hover or focus, the system should prefetch data for that filter category if not already cached.

**Validates: Requirements 15.7**

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

**User Errors:**
- Invalid filter selection
- Unauthorized access attempts

### Error Handling Strategy

**Graceful Degradation:**
```typescript
async function fetchFeedData(userId: string, filter: NewsFilter) {
  try {
    const data = await fetchAllFeedData(userId, filter);
    return { data, error: null };
  } catch (error) {
    // Try to use cached data
    const cachedData = getCachedData(filter);
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

**Empty State:**
```typescript
function EmptyFeedState() {
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
  console.error(`[Feed Error - ${context}]:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  // Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error, { tags: { context } });
}
```

### Validation

**Data Validation:**
```typescript
function validateMatch(match: any): match is Match {
  return (
    match &&
    typeof match.id === 'string' &&
    typeof match.sport === 'string' &&
    typeof match.format === 'string' &&
    (match.played_at === null || typeof match.played_at === 'string')
  );
}

function validateChallenge(challenge: any): challenge is Challenge {
  return (
    challenge &&
    typeof challenge.id === 'string' &&
    typeof challenge.sport === 'string' &&
    typeof challenge.proposed_by === 'string' &&
    typeof challenge.status === 'string'
  );
}
```

**Safe Data Access:**
```typescript
function safeGetOpponentName(match: Match, userId: string): string {
  try {
    const opponent = match.match_players?.find(p => p.user?.id !== userId);
    return opponent?.user?.full_name || 'Unknown Player';
  } catch (error) {
    logError(error as Error, 'safeGetOpponentName');
    return 'Unknown Player';
  }
}
```

## Testing Strategy

### Dual Testing Approach

The feed tab redesign will use both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty states, null values, boundary conditions)
- Error conditions (network failures, invalid data)
- Integration points between components
- User interaction flows (button clicks, filter changes)

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

**Component Rendering:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedHeader } from './FeedHeader';

describe('FeedHeader', () => {
  it('should display the logo with correct styling', () => {
    render(<FeedHeader onSearchClick={() => {}} onNotificationClick={() => {}} onAvatarClick={() => {}} hasNotifications={false} />);
    
    const logo = screen.getByText(/GotGetGo/);
    expect(logo).toBeInTheDocument();
    
    const getAccent = screen.getByText('Get');
    expect(getAccent).toHaveStyle({ fontStyle: 'italic', color: 'var(--color-acc-dk)' });
  });

  it('should display Feed context pill', () => {
    render(<FeedHeader onSearchClick={() => {}} onNotificationClick={() => {}} onAvatarClick={() => {}} hasNotifications={false} />);
    
    expect(screen.getByText('Feed')).toBeInTheDocument();
  });

  it('should display notification dot when hasNotifications is true', () => {
    render(<FeedHeader onSearchClick={() => {}} onNotificationClick={() => {}} onAvatarClick={() => {}} hasNotifications={true} />);
    
    const notificationDot = screen.getByRole('button', { name: /Notifications.*new notifications/ });
    expect(notificationDot).toBeInTheDocument();
  });

  it('should not display notification dot when hasNotifications is false', () => {
    render(<FeedHeader onSearchClick={() => {}} onNotificationClick={() => {}} onAvatarClick={() => {}} hasNotifications={false} />);
    
    const notificationButton = screen.getByRole('button', { name: /Notifications/ });
    expect(notificationButton).not.toHaveTextContent('new notifications');
  });
});
```

**Data Transformation:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateDistance, formatRelativeTime, getInitials } from './utils';

describe('calculateDistance', () => {
  it('should calculate distance between two coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7589, -73.9851); // NYC to Times Square
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(10);
  });

  it('should return 0 for same coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });
});

describe('formatRelativeTime', () => {
  it('should format recent time as minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should format today as "Today"', () => {
    const today = new Date().toISOString();
    expect(formatRelativeTime(today)).toBe('Today');
  });

  it('should format yesterday as "Yesterday"', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });
});

describe('getInitials', () => {
  it('should extract initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });

  it('should handle single name', () => {
    expect(getInitials('Madonna')).toBe('M');
  });

  it('should handle empty string', () => {
    expect(getInitials('')).toBe('');
  });
});
```

**Error Handling:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchFeedData } from './api';

describe('fetchFeedData error handling', () => {
  it('should return cached data when network fails', async () => {
    const mockCache = { heroMatch: null, challenges: [], openMatches: [], weeklyMatches: [], tournaments: [] };
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    
    const result = await fetchFeedData('user-123', 'all');
    
    expect(result.error).toBeTruthy();
    expect(result.data).toBeTruthy(); // Should have cached data
  });

  it('should return error state when no cache exists', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    // Clear cache
    
    const result = await fetchFeedData('user-123', 'all');
    
    expect(result.error).toBeTruthy();
    expect(result.data).toBeNull();
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

**Property 1: Notification indicator visibility**
```typescript
import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import fc from 'fast-check';
import { FeedHeader } from './FeedHeader';

describe('Property-Based Tests', () => {
  it('Property 1: Notification indicator visibility - Feature: feed-tab-redesign, Property 1: For any notification state, the notification bell icon should display a green dot indicator if and only if notifications exist', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // hasNotifications
        (hasNotifications) => {
          const { container } = render(
            <FeedHeader
              onSearchClick={() => {}}
              onNotificationClick={() => {}}
              onAvatarClick={() => {}}
              hasNotifications={hasNotifications}
            />
          );
          
          const notificationDot = container.querySelector('.notification-dot');
          const dotExists = notificationDot !== null;
          
          // Property: dot exists if and only if hasNotifications is true
          return dotExists === hasNotifications;
        }
      )
    );
  });
});
```

**Property 10: Challenge card avatar initials**
```typescript
it('Property 10: Challenge card avatar initials - Feature: feed-tab-redesign, Property 10: For any player name, the challenge card avatar should display the correct initials', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // player name
      (playerName) => {
        const expectedInitials = getInitials(playerName);
        
        const { container } = render(
          <ChallengeCard
            challenge={mockChallenge}
            challenger={{ ...mockProfile, full_name: playerName }}
            onRespondClick={() => {}}
          />
        );
        
        const avatar = container.querySelector('.ch-avatar');
        const displayedInitials = avatar?.textContent || '';
        
        // Property: displayed initials match calculated initials
        return displayedInitials === expectedInitials;
      }
    )
  );
});
```

**Property 18: Digest card win/loss badges**
```typescript
it('Property 18: Digest card win/loss badges - Feature: feed-tab-redesign, Property 18: For any match outcome, the digest card should display correct win/loss badge', () => {
  fc.assert(
    fc.property(
      fc.boolean(), // isWin
      fc.record({
        id: fc.uuid(),
        sport: fc.constantFrom('tennis', 'padel', 'squash'),
        played_at: fc.date().map(d => d.toISOString()),
      }),
      (isWin, matchData) => {
        const { container } = render(
          <DigestRow
            match={matchData as any}
            opponent={mockProfile}
            isWin={isWin}
          />
        );
        
        const badge = container.querySelector('.res-badge');
        const badgeText = badge?.textContent || '';
        const hasWinClass = badge?.classList.contains('rw');
        const hasLossClass = badge?.classList.contains('rl');
        
        // Property: badge shows "W" with green class if win, "L" with red class if loss
        if (isWin) {
          return badgeText === 'W' && hasWinClass && !hasLossClass;
        } else {
          return badgeText === 'L' && hasLossClass && !hasWinClass;
        }
      }
    )
  );
});
```

**Property 26: Distance calculation**
```typescript
it('Property 26: Distance calculation - Feature: feed-tab-redesign, Property 26: For any pair of coordinates, distance calculation should be symmetric and non-negative', () => {
  fc.assert(
    fc.property(
      fc.double({ min: -90, max: 90 }), // lat1
      fc.double({ min: -180, max: 180 }), // lng1
      fc.double({ min: -90, max: 90 }), // lat2
      fc.double({ min: -180, max: 180 }), // lng2
      (lat1, lng1, lat2, lng2) => {
        const distance1 = calculateDistance(lat1, lng1, lat2, lng2);
        const distance2 = calculateDistance(lat2, lng2, lat1, lng1);
        
        // Property: distance is symmetric and non-negative
        return distance1 === distance2 && distance1 >= 0;
      }
    )
  );
});
```

**Property 27: Relative time formatting**
```typescript
it('Property 27: Relative time formatting - Feature: feed-tab-redesign, Property 27: For any timestamp, relative time should be correctly formatted', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 365 * 24 * 60 }), // minutes ago (up to 1 year)
      (minutesAgo) => {
        const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
        const formatted = formatRelativeTime(timestamp);
        
        // Property: format matches expected pattern based on time difference
        if (minutesAgo < 60) {
          return formatted.endsWith('m ago') || formatted === 'Today';
        } else if (minutesAgo < 24 * 60) {
          return formatted.endsWith('h ago') || formatted === 'Today';
        } else if (minutesAgo < 2 * 24 * 60) {
          return formatted === 'Today' || formatted === 'Yesterday';
        } else if (minutesAgo < 7 * 24 * 60) {
          return formatted.endsWith('d ago') || /\d{1,2}\/\d{1,2}\/\d{4}/.test(formatted);
        } else {
          return /\d{1,2}\/\d{1,2}\/\d{4}/.test(formatted);
        }
      }
    )
  );
});
```

**Property 34: Filter change debouncing**
```typescript
it('Property 34: Filter change debouncing - Feature: feed-tab-redesign, Property 34: For any rapid sequence of filter changes, only the last change should execute after 300ms', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(fc.constantFrom('all', 'challenges', 'results', 'near_me', 'tournaments'), { minLength: 2, maxLength: 10 }),
      async (filterSequence) => {
        const executedFilters: string[] = [];
        const debouncedUpdate = debounce((filter: string) => {
          executedFilters.push(filter);
        }, 300);
        
        // Rapidly trigger filter changes
        filterSequence.forEach(filter => debouncedUpdate(filter));
        
        // Wait for debounce to complete
        await new Promise(resolve => setTimeout(resolve, 350));
        
        // Property: only the last filter in sequence should execute
        return executedFilters.length === 1 && executedFilters[0] === filterSequence[filterSequence.length - 1];
      }
    )
  );
});
```

### Test Coverage Goals

**Unit Tests:**
- Component rendering: 100% of components
- User interactions: All button clicks, filter changes, modal opens
- Edge cases: Empty states, null values, boundary conditions
- Error handling: Network failures, invalid data, missing fields

**Property-Based Tests:**
- All 35 correctness properties defined in this document
- Each property test runs 100+ iterations
- Focus on data transformations, calculations, and conditional rendering

**Integration Tests:**
- Full feed page rendering with mock data
- Filter changes triggering data refetch
- Error states with cache fallback
- Modal interactions and navigation

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
name: Test Feed Tab Redesign
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


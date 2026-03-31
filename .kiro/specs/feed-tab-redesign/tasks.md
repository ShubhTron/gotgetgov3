# Implementation Plan: Feed Tab Redesign

## Overview

This plan implements the Feed Tab Redesign feature, transforming the current single-column gradient card feed into a modern, segmented feed with multiple content sections. The implementation replaces `src/pages/news/NewsPage.tsx` with a new `FeedPage` component featuring hero highlights, challenges, open matches, weekly digests, and tournaments.

## Tasks

- [x] 1. Set up utility functions and type definitions
  - Create `src/lib/feed-utils.ts` with calculateDistance, formatRelativeTime, calculateEloChange, and getInitials functions
  - Create `src/types/feed.ts` with NewsFilter, FeedHeroMatch, FeedChallenge, FeedOpenMatch, FeedDigestMatch, and FeedTournament interfaces
  - _Requirements: 13.5, 13.6, 13.7_

- [ ]* 1.1 Write property tests for utility functions
  - **Property 26: Distance calculation symmetry and non-negativity**
  - **Validates: Requirements 13.6**
  - **Property 27: Relative time formatting correctness**
  - **Validates: Requirements 13.7**

- [x] 2. Create data fetching functions
  - [x] 2.1 Create `src/api/feed-api.ts` with fetchHeroMatch function
    - Fetch latest confirmed match with players and club data
    - Calculate ELO change and generate sparkline data
    - _Requirements: 13.1, 13.5_
  
  - [x] 2.2 Implement fetchChallenges function
    - Fetch incoming challenges with proposer and players
    - Calculate distance from user location
    - Determine if challenge is new (< 24 hours)
    - _Requirements: 13.2, 13.6_
  
  - [x] 2.3 Implement fetchOpenMatches function
    - Fetch open matches with host and club data
    - Calculate distance from user location
    - _Requirements: 13.3, 13.6_
  
  - [x] 2.4 Implement fetchWeeklyMatches function
    - Fetch matches from last 7 days
    - Determine win/loss status for each match
    - _Requirements: 13.1_
  
  - [x] 2.5 Implement fetchTournaments function
    - Fetch active tournaments with registration open
    - Calculate spots remaining
    - _Requirements: 13.4_
  
  - [x] 2.6 Implement caching strategy with getCachedData and setCachedData functions
    - In-memory cache with 5-minute TTL
    - Maximum 5 cached filter states
    - _Requirements: 15.4_

- [ ]* 2.7 Write property tests for data fetching
  - **Property 24: Database query execution**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
  - **Property 25: ELO calculation correctness**
  - **Validates: Requirements 13.5**
  - **Property 28: Error handling with cache fallback**
  - **Validates: Requirements 13.8, 13.9**

- [x] 3. Checkpoint - Ensure utility and API functions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create base UI components
  - [x] 4.1 Create FeedHeader component in `src/components/feed/FeedHeader.tsx`
    - Display logo with "Get" in italic green accent
    - Include "Feed" context pill
    - Add search, notification bell with dot indicator, and avatar buttons
    - Fixed height 52px with cream background
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 4.2 Create SegmentStrip component in `src/components/feed/SegmentStrip.tsx`
    - Horizontal scrollable filter bar with All, Challenges, Results, Near Me, Tournaments
    - Active filter: dark background with light text
    - Inactive filter: white background with gray text
    - Right-edge fade indicator
    - Hidden scrollbars with scroll functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 4.3 Create SectionHeader component in `src/components/feed/SectionHeader.tsx`
    - Uppercase label with small gray text and wide letter spacing
    - Optional right-aligned link in green accent
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 4.4 Write property tests for base UI components
  - **Property 1: Notification indicator visibility**
  - **Validates: Requirements 1.4**
  - **Property 2: Filter selection styling**
  - **Validates: Requirements 2.3, 2.4**
  - **Property 22: Section header link display**
  - **Validates: Requirements 9.3**

- [x] 5. Create hero section components
  - [x] 5.1 Create HeroCard component in `src/components/feed/HeroCard.tsx`
    - Dark background with radial green glow effect
    - Eyebrow label with sport and time
    - Headline with opponent name in italic green accent
    - Score badge in top-right of headline area
    - Venue details as subtitle
    - Pill badges for time elapsed, ELO change, and location
    - Share Result button and options button
    - Top radius 22px, bottom 0 (connects to ELO strip)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  
  - [x] 5.2 Create ELOStrip component in `src/components/feed/ELOStrip.tsx`
    - Attach directly below HeroCard with no gap
    - Display sparkline chart showing rating trend
    - Show rating change with plus/minus indicator
    - Display current total rating
    - Light background with bottom radius 18px
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 5.3 Write property tests for hero section
  - **Property 4: Hero card eyebrow formatting**
  - **Validates: Requirements 3.2**
  - **Property 5: Hero card headline formatting**
  - **Validates: Requirements 3.3**
  - **Property 6: Hero card venue display**
  - **Validates: Requirements 3.5**
  - **Property 7: Hero card pill badges**
  - **Validates: Requirements 3.6**
  - **Property 8: ELO change sign indicator**
  - **Validates: Requirements 4.3**
  - **Property 9: ELO current rating display**
  - **Validates: Requirements 4.4**

- [x] 6. Create challenge and match card components
  - [x] 6.1 Create ChallengeCard component in `src/components/feed/ChallengeCard.tsx`
    - White background with subtle shadow
    - Rounded square avatar with player initials
    - Display player name, sport, ELO rating, distance
    - Date/time pill badges
    - "New" badge in green accent if created < 24 hours
    - Respond button aligned right
    - 16px border radius
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x] 6.2 Create OpenMatchCard component in `src/components/feed/OpenMatchCard.tsx`
    - Fixed width 148px
    - Rounded square avatar with player initials
    - Display player name
    - Sport as green pill badge
    - Date, time, and distance details
    - Join Match button
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 6.3 Write property tests for challenge and match cards
  - **Property 10: Challenge card avatar initials**
  - **Validates: Requirements 5.2**
  - **Property 11: Challenge card player information**
  - **Validates: Requirements 5.3**
  - **Property 12: Challenge new badge display**
  - **Validates: Requirements 5.5**
  - **Property 13: Open match card avatar initials**
  - **Validates: Requirements 6.2**
  - **Property 14: Open match card player name**
  - **Validates: Requirements 6.3**
  - **Property 15: Open match card sport badge**
  - **Validates: Requirements 6.4**
  - **Property 16: Open match card details**
  - **Validates: Requirements 6.5**

- [x] 7. Create digest and tournament card components
  - [x] 7.1 Create DigestCard and DigestRow components in `src/components/feed/DigestCard.tsx`
    - DigestCard: white background with 18px radius
    - DigestRow: display opponent name, venue, score, time/date
    - Green "W" badge for wins, red "L" badge for losses
    - Rows separated by border lines
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 7.2 Create TournamentCard component in `src/components/feed/TournamentCard.tsx`
    - White background with 16px radius
    - Dark rounded square icon with trophy/globe symbol
    - Display tournament name and details (dates, player count, skill level)
    - Enter/Join button with green accent background
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ]* 7.3 Write property tests for digest and tournament cards
  - **Property 17: Digest card multiple rows**
  - **Validates: Requirements 7.1**
  - **Property 18: Digest card win/loss badges**
  - **Validates: Requirements 7.2, 7.3**
  - **Property 19: Digest card match information**
  - **Validates: Requirements 7.4, 7.5**
  - **Property 20: Tournament card name display**
  - **Validates: Requirements 8.3**
  - **Property 21: Tournament card details display**
  - **Validates: Requirements 8.4**

- [x] 8. Create feed sections with horizontal scrolling
  - [x] 8.1 Create HeroSection component in `src/components/feed/HeroSection.tsx`
    - Conditionally render based on heroMatch data
    - Include SectionHeader, HeroCard, and ELOStrip
    - _Requirements: 12.1_
  
  - [x] 8.2 Create ChallengesSection component in `src/components/feed/ChallengesSection.tsx`
    - Conditionally render based on challenges data
    - Include SectionHeader and ChallengeCard list
    - _Requirements: 12.2_
  
  - [x] 8.3 Create OpenMatchesSection component in `src/components/feed/OpenMatchesSection.tsx`
    - Conditionally render based on openMatches data
    - Horizontal scrollable container with fade indicator
    - Hidden scrollbars with scroll functionality
    - Extra right padding to prevent clipping
    - _Requirements: 6.8, 6.9, 6.10, 12.3_
  
  - [x] 8.4 Create DigestSection component in `src/components/feed/DigestSection.tsx`
    - Conditionally render based on weeklyMatches data
    - Include SectionHeader and DigestCard
    - _Requirements: 12.4_
  
  - [x] 8.5 Create TournamentsSection component in `src/components/feed/TournamentsSection.tsx`
    - Conditionally render based on tournaments data
    - Include SectionHeader and TournamentCard list
    - _Requirements: 12.5_

- [ ]* 8.6 Write property tests for feed sections
  - **Property 23: Empty section hiding**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

- [x] 9. Checkpoint - Ensure all components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement main FeedPage component
  - [x] 10.1 Create FeedPage component in `src/pages/feed/FeedPage.tsx`
    - Set up state for heroMatch, challenges, openMatches, weeklyMatches, tournaments
    - Add loading and error states
    - Implement useEffect for data fetching on mount and filter change
    - Fetch data in parallel using Promise.all()
    - Handle errors with cache fallback
    - _Requirements: 13.8, 13.9_
  
  - [x] 10.2 Implement filter change handling with debouncing
    - Debounce filter changes by 300ms
    - Check cache before fetching
    - Update displayed content based on active filter
    - _Requirements: 2.7, 15.6_
  
  - [x] 10.3 Add EmptyState component for when all sections are empty
    - Display centered message with icon
    - Include call-to-action button
    - _Requirements: 12.6_
  
  - [x] 10.4 Implement responsive scrolling behavior
    - Vertical scroll for main feed content
    - Hidden scrollbars with scroll functionality
    - Momentum scrolling on touch devices
    - Bottom padding to prevent tab bar overlap
    - _Requirements: 11.1, 11.2, 11.5, 11.6_

- [ ]* 10.5 Write property tests for FeedPage
  - **Property 3: Content filtering**
  - **Validates: Requirements 2.7**
  - **Property 34: Filter change debouncing**
  - **Validates: Requirements 15.6**

- [x] 11. Implement interactive actions
  - [x] 11.1 Add Share Result action to HeroCard
    - Open share dialog on button click
    - _Requirements: 14.1_
  
  - [x] 11.2 Add Respond action to ChallengeCard
    - Open challenge response modal on button click
    - _Requirements: 14.2_
  
  - [x] 11.3 Add Join Match action to OpenMatchCard
    - Open match join confirmation dialog on button click
    - _Requirements: 14.3_
  
  - [x] 11.4 Add Enter Tournament action to TournamentCard
    - Open tournament registration flow on button click
    - _Requirements: 14.4_
  
  - [x] 11.5 Add section link navigation
    - Navigate to full view on section link click
    - _Requirements: 14.5_
  
  - [x] 11.6 Add header button actions
    - Search icon opens search interface
    - Notification bell opens notifications panel
    - Avatar navigates to user profile
    - _Requirements: 14.6, 14.7, 14.8_

- [ ]* 11.7 Write unit tests for interactive actions
  - Test button click handlers
  - Test modal/dialog opening
  - Test navigation triggers

- [x] 12. Implement performance optimizations
  - [x] 12.1 Add skeleton loading states
    - Display skeleton UI while fetching data
    - _Requirements: 15.2_
  
  - [x] 12.2 Implement lazy image loading
    - Use Intersection Observer for images
    - Load images as they enter viewport
    - _Requirements: 15.3_
  
  - [x] 12.3 Add prefetching for adjacent filters
    - Prefetch data on filter hover/focus
    - Only prefetch if not already cached
    - _Requirements: 15.7_
  
  - [x] 12.4 Optimize header render performance
    - Ensure header renders within 100ms
    - _Requirements: 15.1_

- [ ]* 12.5 Write property tests for performance features
  - **Property 29: Header render performance**
  - **Validates: Requirements 15.1**
  - **Property 30: Loading state display**
  - **Validates: Requirements 15.2**
  - **Property 31: Image lazy loading**
  - **Validates: Requirements 15.3**
  - **Property 32: Feed data caching**
  - **Validates: Requirements 15.4**
  - **Property 35: Adjacent filter prefetching**
  - **Validates: Requirements 15.7**

- [x] 13. Add error handling and empty states
  - [x] 13.1 Create NetworkErrorBanner component
    - Display when data fetch fails but cache exists
    - Include retry button
    - _Requirements: 13.8_
  
  - [x] 13.2 Create error logging utility
    - Log errors with context and timestamp
    - _Requirements: 13.8, 13.9_
  
  - [x] 13.3 Add data validation functions
    - Validate match, challenge, and tournament data
    - Safe data access with fallbacks
    - _Requirements: 13.8, 13.9_

- [ ]* 13.4 Write unit tests for error handling
  - Test network error scenarios
  - Test cache fallback behavior
  - Test data validation
  - Test error logging

- [x] 14. Update routing and navigation
  - [x] 14.1 Update App.tsx to use FeedPage instead of NewsPage
    - Replace NewsPage import with FeedPage
    - Maintain /news route for backward compatibility
    - _Requirements: 1.1_
  
  - [x] 14.2 Create index file for feed components
    - Export all feed components from `src/components/feed/index.ts`

- [x] 15. Checkpoint - Final integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 16. Write integration tests
  - Test full feed page rendering with mock data
  - Test filter changes triggering data refetch
  - Test error states with cache fallback
  - Test modal interactions and navigation

- [x] 17. Final cleanup and documentation
  - Remove old NewsPage.tsx file
  - Update any references to NewsPage in other files
  - Verify all components follow design system patterns
  - Ensure accessibility compliance (ARIA labels, keyboard navigation)

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation follows the existing codebase patterns (inline styles, CSS custom properties)
- All components integrate with existing contexts (AuthContext, FilterContext)

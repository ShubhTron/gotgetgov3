# Requirements Document

## Introduction

This document specifies the requirements for redesigning and rebuilding the Feed tab in the GotGetGo application. The redesign transforms the current single-column feed of gradient cards into a modern, segmented feed with multiple content sections including highlights, challenges, open matches, weekly digests, and tournaments. The new design emphasizes visual hierarchy, content categorization, and improved user engagement through specialized card types and horizontal scrolling sections.

## Glossary

- **Feed_System**: The complete feed tab interface including header, filters, and all content sections
- **Header_Component**: The top navigation bar containing logo, context pill, search, notifications, and avatar
- **Segment_Strip**: The horizontal scrollable filter bar with category options (All, Challenges, Results, Near Me, Tournaments)
- **Hero_Card**: The prominent highlight card displaying the user's latest match result with detailed statistics
- **ELO_Strip**: The rating display component attached below the hero card showing ELO changes and sparkline
- **Challenge_Card**: Individual white card displaying incoming match challenges from other players
- **Open_Match_Card**: Horizontal scrollable card showing available matches to join
- **Digest_Card**: Multi-row card displaying weekly match history with win/loss indicators
- **Tournament_Card**: Card displaying tournament information with entry options
- **Section_Header**: Label and link combination marking the start of each feed section
- **Fade_Indicator**: Visual gradient overlay signaling horizontal scrollability

## Requirements

### Requirement 1: Header Navigation

**User Story:** As a user, I want to see a clear header with branding and quick access to key actions, so that I can navigate the app and access important features quickly.

#### Acceptance Criteria

1. THE Header_Component SHALL display the logo "GotGetGo" with "Get" in italic green accent color
2. THE Header_Component SHALL display a "Feed" context pill inline with the logo
3. THE Header_Component SHALL include a search icon button
4. THE Header_Component SHALL include a notification bell icon with a green dot indicator when notifications exist
5. THE Header_Component SHALL include a user avatar button
6. THE Header_Component SHALL use cream/beige background color (#F4F3EF)
7. THE Header_Component SHALL maintain a fixed height of 52px

### Requirement 2: Segment Filter Strip

**User Story:** As a user, I want to filter feed content by category, so that I can focus on specific types of updates.

#### Acceptance Criteria

1. THE Segment_Strip SHALL display horizontally scrollable filter options
2. THE Segment_Strip SHALL include filter options: "All", "Challenges", "Results", "Near Me", "Tournaments"
3. WHEN a filter is selected, THE Segment_Strip SHALL highlight it with dark background and light text
4. WHEN a filter is not selected, THE Segment_Strip SHALL display it with white background and gray text
5. THE Segment_Strip SHALL display a right-edge Fade_Indicator to signal scrollability
6. THE Segment_Strip SHALL hide scrollbars while maintaining scroll functionality
7. WHEN a filter is selected, THE Feed_System SHALL display only content matching that category

### Requirement 3: Hero Highlight Card

**User Story:** As a user, I want to see my latest match result prominently displayed, so that I can quickly view my recent performance and share it.

#### Acceptance Criteria

1. THE Hero_Card SHALL display on a dark background with radial green glow effect
2. THE Hero_Card SHALL include an eyebrow label showing "Match Result · [Sport] · [Time]"
3. THE Hero_Card SHALL display the match headline with opponent name in italic green accent
4. THE Hero_Card SHALL display the match score in a badge positioned in the top-right of the headline area
5. THE Hero_Card SHALL display venue details as subtitle text
6. THE Hero_Card SHALL include pill badges showing time elapsed, ELO change with up arrow, and location
7. THE Hero_Card SHALL include a primary "Share Result" button
8. THE Hero_Card SHALL include a secondary options button with three-dot icon
9. THE Hero_Card SHALL use rounded corners on top only (22px radius)
10. THE Hero_Card SHALL connect flush to the ELO_Strip below with no gap

### Requirement 4: ELO Rating Display

**User Story:** As a user, I want to see my rating change after a match, so that I can track my skill progression.

#### Acceptance Criteria

1. THE ELO_Strip SHALL attach directly below the Hero_Card with no gap
2. THE ELO_Strip SHALL display a sparkline chart showing rating trend
3. THE ELO_Strip SHALL display the rating change amount with plus/minus indicator
4. THE ELO_Strip SHALL display the current total rating
5. THE ELO_Strip SHALL use light background color (#F0EFEB)
6. THE ELO_Strip SHALL use rounded corners on bottom only (18px radius)
7. THE ELO_Strip SHALL display "Rating after today" label above the change amount

### Requirement 5: Challenge Cards

**User Story:** As a user, I want to see incoming match challenges clearly, so that I can respond to them promptly.

#### Acceptance Criteria

1. THE Challenge_Card SHALL display on white background with subtle shadow
2. THE Challenge_Card SHALL include a rounded square avatar with player initials
3. THE Challenge_Card SHALL display player name, sport, ELO rating, and distance
4. THE Challenge_Card SHALL include date/time pill badges below player information
5. WHEN a challenge is new, THE Challenge_Card SHALL display a "New" badge in green accent color
6. THE Challenge_Card SHALL include a "Respond" button aligned to the right
7. THE Challenge_Card SHALL use 16px border radius
8. THE Challenge_Card SHALL display as individual cards with 8px spacing between them

### Requirement 6: Open Matches Section

**User Story:** As a user, I want to browse available matches near me, so that I can join matches that fit my schedule.

#### Acceptance Criteria

1. THE Open_Match_Card SHALL display in a horizontal scrollable container
2. THE Open_Match_Card SHALL include a rounded square avatar with player initials
3. THE Open_Match_Card SHALL display player name
4. THE Open_Match_Card SHALL display sport as a green pill badge
5. THE Open_Match_Card SHALL display date, time, and distance details
6. THE Open_Match_Card SHALL include a "Join Match" button
7. THE Open_Match_Card SHALL have fixed width of 148px
8. THE Feed_System SHALL display a right-edge Fade_Indicator on the horizontal scroll container
9. THE horizontal scroll container SHALL hide scrollbars while maintaining scroll functionality
10. THE horizontal scroll container SHALL include extra right padding so the last card is not clipped

### Requirement 7: Weekly Digest Card

**User Story:** As a user, I want to see a summary of my recent matches, so that I can review my weekly performance at a glance.

#### Acceptance Criteria

1. THE Digest_Card SHALL display multiple match rows in a single white card
2. WHEN a match is won, THE Digest_Card SHALL display a green "W" badge
3. WHEN a match is lost, THE Digest_Card SHALL display a red "L" badge
4. THE Digest_Card SHALL display opponent name and venue details for each match
5. THE Digest_Card SHALL display match score and time/date for each match
6. THE Digest_Card SHALL separate rows with border lines
7. THE Digest_Card SHALL use 18px border radius
8. THE Digest_Card SHALL display on white background with subtle shadow

### Requirement 8: Tournament Cards

**User Story:** As a user, I want to see nearby tournaments, so that I can discover and enter competitive events.

#### Acceptance Criteria

1. THE Tournament_Card SHALL display on white background with subtle shadow
2. THE Tournament_Card SHALL include a dark rounded square icon with trophy or globe symbol
3. THE Tournament_Card SHALL display tournament name
4. THE Tournament_Card SHALL display tournament details (dates, player count, skill level)
5. THE Tournament_Card SHALL include an "Enter" or "Join" button with green accent background
6. THE Tournament_Card SHALL use 16px border radius
7. THE Tournament_Card SHALL display as individual cards with 8px spacing between them

### Requirement 9: Section Headers

**User Story:** As a user, I want to see clear section labels, so that I can understand the organization of feed content.

#### Acceptance Criteria

1. THE Section_Header SHALL display above each content section
2. THE Section_Header SHALL include an uppercase label in small gray text with wide letter spacing
3. THE Section_Header SHALL include a right-aligned link when additional content is available
4. THE Section_Header SHALL use 9px font size for the label
5. THE Section_Header SHALL use green accent color for the link text

### Requirement 10: Visual Design System

**User Story:** As a user, I want a consistent and modern visual design, so that the app feels polished and professional.

#### Acceptance Criteria

1. THE Feed_System SHALL use cream/beige background color (#F4F3EF)
2. THE Feed_System SHALL use white (#FFFFFF) for card backgrounds
3. THE Feed_System SHALL use green accent color (#16D46A) for primary actions and highlights
4. THE Feed_System SHALL use dark color (#14120E) for primary text
5. THE Feed_System SHALL use gray colors (#8A8880, #C2C0B8) for secondary text
6. THE Feed_System SHALL use Figtree font for body text
7. THE Feed_System SHALL use Cormorant serif font for headline text
8. THE Feed_System SHALL use consistent border radius values (16-22px for cards)
9. THE Feed_System SHALL use subtle shadows for card elevation
10. THE Feed_System SHALL use smooth transitions for interactive elements

### Requirement 11: Responsive Scrolling

**User Story:** As a user, I want smooth scrolling behavior, so that I can navigate the feed comfortably.

#### Acceptance Criteria

1. THE Feed_System SHALL enable vertical scrolling for the main feed content
2. THE Feed_System SHALL hide vertical scrollbars while maintaining scroll functionality
3. THE Feed_System SHALL enable horizontal scrolling for the Segment_Strip
4. THE Feed_System SHALL enable horizontal scrolling for the Open_Match_Card container
5. THE Feed_System SHALL use momentum scrolling on touch devices
6. THE Feed_System SHALL include bottom padding to prevent content from being hidden behind the tab bar

### Requirement 12: Empty State Handling

**User Story:** As a user, I want helpful guidance when sections are empty, so that I understand why content is missing and what actions I can take.

#### Acceptance Criteria

1. WHEN no highlights exist, THE Feed_System SHALL hide the "Your Highlight" section
2. WHEN no challenges exist, THE Feed_System SHALL hide the "Challenges" section
3. WHEN no open matches exist, THE Feed_System SHALL hide the "Open Matches Near You" section
4. WHEN no weekly matches exist, THE Feed_System SHALL hide the "This Week" section
5. WHEN no tournaments exist, THE Feed_System SHALL hide the "Tournaments Near You" section
6. WHEN all sections are empty, THE Feed_System SHALL display a centered empty state message

### Requirement 13: Data Integration

**User Story:** As a developer, I want to integrate real data sources, so that the feed displays actual user information.

#### Acceptance Criteria

1. THE Feed_System SHALL fetch user match results from the database
2. THE Feed_System SHALL fetch incoming challenges from the database
3. THE Feed_System SHALL fetch open matches from the database
4. THE Feed_System SHALL fetch tournament information from the database
5. THE Feed_System SHALL calculate ELO changes based on match results
6. THE Feed_System SHALL calculate distances based on user location and venue location
7. THE Feed_System SHALL format timestamps as relative time (e.g., "2h ago", "Today", "Yesterday")
8. WHEN data fetching fails, THE Feed_System SHALL display cached data if available
9. WHEN data fetching fails and no cache exists, THE Feed_System SHALL display an error state

### Requirement 14: Interactive Actions

**User Story:** As a user, I want to interact with feed items, so that I can take actions on content that interests me.

#### Acceptance Criteria

1. WHEN the "Share Result" button is clicked, THE Feed_System SHALL open a share dialog
2. WHEN the "Respond" button is clicked on a Challenge_Card, THE Feed_System SHALL open a challenge response modal
3. WHEN the "Join Match" button is clicked on an Open_Match_Card, THE Feed_System SHALL open a match join confirmation dialog
4. WHEN the "Enter" button is clicked on a Tournament_Card, THE Feed_System SHALL open a tournament registration flow
5. WHEN a section link is clicked, THE Feed_System SHALL navigate to the full view of that content type
6. WHEN the search icon is clicked, THE Feed_System SHALL open the search interface
7. WHEN the notification bell is clicked, THE Feed_System SHALL open the notifications panel
8. WHEN the avatar is clicked, THE Feed_System SHALL navigate to the user profile

### Requirement 15: Performance Optimization

**User Story:** As a user, I want the feed to load quickly, so that I can access information without delays.

#### Acceptance Criteria

1. THE Feed_System SHALL load and display the header within 100ms
2. THE Feed_System SHALL display skeleton loading states while fetching data
3. THE Feed_System SHALL lazy load images as they enter the viewport
4. THE Feed_System SHALL cache feed data for offline viewing
5. THE Feed_System SHALL implement virtual scrolling for feeds with more than 50 items
6. THE Feed_System SHALL debounce filter changes by 300ms
7. THE Feed_System SHALL prefetch data for adjacent filter categories

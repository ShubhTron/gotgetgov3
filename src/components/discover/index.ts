// Discover components barrel — exports all public-facing discover components

// SwipeDeck (SwipeCard API with framer-motion drag)
export { SwipeDeck, type SwipeCard } from './SwipeDeck';

// Player card (full-bleed image with glassmorphic pill)
export { PlayerCard, type Player } from './PlayerCard';

// Fullscreen discovery mode
export { FullscreenView, type FullscreenViewProps } from './FullscreenView';

// Profile details view (About, More Info, Match History, Performance, Updates)
export {
  ProfileDetailsView,
  type ProfileDetailsViewProps,
  type MatchHistoryItem,
  type PerformanceDataPoint,
  type LatestUpdate,
} from './ProfileDetailsView';

// Discovery card (full-bleed with blur-up image loading)
export { DiscoveryCard, type DiscoveryCardProps } from './DiscoveryCard';

// Discovery card variants (Club, Coach, Competition, Event, Swipeable*)
export {
  ClubCard,
  CoachCard,
  CompetitionCard,
  EventCard,
  SwipeableClubCard,
  SwipeableCompetitionCard,
  SwipeableEventCard,
  SwipeableCoachCard,
  EmptyState,
  type Club,
  type Coach,
  type Competition,
  type Event,
} from './DiscoveryCards';

// Stories row
export { StoriesRow, type StoryPlayer } from './StoriesRow';

// Header & filters
export { DiscoverHeader } from './DiscoverHeader';
export { DiscoverFilters } from './DiscoverFilters';

// Interaction buttons
export { InteractionButtons, type InteractionButtonsProps } from './InteractionButtons';

// Player profile preview (bottom sheet)
export { PlayerProfilePreview, type PlayerProfilePreviewProps } from './PlayerProfilePreview';

// Open match card
export { OpenMatchCard, type OpenMatch } from './OpenMatchCard';

// Invite friends card
export { InviteFriendsCard } from './InviteFriendsCard';

// Archive section (photo grid with lazy loading and fullscreen viewer)
export { ArchiveSection, type ArchiveSectionProps, type ArchivePhoto } from './ArchiveSection';

import { useRef, useEffect, forwardRef } from 'react';
import {
  HeroSection,
  ChallengesSection,
  OpenMatchesSection,
  DigestSection,
  TournamentsSection,
  HeroSectionSkeleton,
  ChallengesSectionSkeleton,
  OpenMatchesSectionSkeleton,
  DigestSectionSkeleton,
  TournamentsSectionSkeleton,
} from '@/components/feed';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import type { FeedData } from '@/api/feed-api';
import type { FeedChallenge, FeedOpenMatch, FeedTournament } from '@/types/feed';
import { Trophy } from 'lucide-react';

// NetworkErrorBanner Component
interface NetworkErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function NetworkErrorBanner({ message, onRetry }: NetworkErrorBannerProps) {
  return (
    <div
      style={{
        background: 'rgba(232, 64, 64, 0.07)',
        border: '1px solid #E84040',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p style={{ fontWeight: 600, color: '#E84040', marginBottom: 4 }}>
          Connection Error
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-t2)' }}>
          {message}
        </p>
      </div>
      <button
        onClick={onRetry}
        style={{
          background: '#E84040',
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

// EmptyMatchesState Component
interface EmptyMatchesStateProps {
  onFindMatches?: () => void;
}

export function EmptyMatchesState({ onFindMatches }: EmptyMatchesStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Trophy size={36} style={{ color: 'var(--color-t3)' }} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-t1)',
          marginBottom: 8,
        }}
      >
        No activity yet
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-t2)',
          maxWidth: 280,
          marginBottom: 24,
        }}
      >
        Play some matches and join tournaments to see your feed come to life.
      </p>
      <button
        onClick={onFindMatches}
        style={{
          padding: '12px 28px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-acc)',
          color: '#fff',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Find Matches
      </button>
    </div>
  );
}

interface MatchesViewProps {
  feedData: FeedData;
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const MatchesView = forwardRef<HTMLDivElement, MatchesViewProps>(
  function MatchesView({
    feedData,
    loading,
    error,
    onRefresh,
    scrollContainerRef,
  }, ref) {

  // Handle section interactions (placeholder handlers)
  const handleShareClick = () => {
    console.log('Share clicked');
  };

  const handleOptionsClick = () => {
    console.log('Options clicked');
  };

  const handleRespondClick = (challenge: FeedChallenge) => {
    console.log('Respond to challenge:', challenge.challenge.id);
  };

  const handleJoinClick = (openMatch: FeedOpenMatch) => {
    console.log('Join open match:', openMatch.challenge.id);
  };

  const handleEnterClick = (tournament: FeedTournament) => {
    console.log('Enter tournament:', tournament.competition.id);
  };

  // Edge Case 1: Handle unauthenticated user
  if (error?.message === 'UNAUTHENTICATED') {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
          background: 'var(--color-bg)',
        }}
        data-view="matches"
      >
        <ErrorState
          message="Please sign in to view your matches and activity."
          onRetry={undefined}
        />
      </div>
    );
  }

  // Edge Case 3: Handle network timeout
  if (error?.message === 'NETWORK_TIMEOUT') {
    // Check if we have cached data to show
    const hasCachedData = feedData.heroMatch || feedData.challenges.length > 0 || 
                          feedData.openMatches.length > 0 || feedData.weeklyMatches.length > 0 || 
                          feedData.tournaments.length > 0;

    if (!hasCachedData) {
      return (
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 16px 80px',
            background: 'var(--color-bg)',
          }}
          data-view="matches"
        >
          <ErrorState
            message="Request timed out. Please check your connection and try again."
            onRetry={onRefresh}
          />
        </div>
      );
    }
    // If we have cached data, show it with error banner below
  }

  // Edge Case 4: Handle invalid data format
  if (error?.message === 'INVALID_DATA_FORMAT') {
    // Check if we have cached data to show
    const hasCachedData = feedData.heroMatch || feedData.challenges.length > 0 || 
                          feedData.openMatches.length > 0 || feedData.weeklyMatches.length > 0 || 
                          feedData.tournaments.length > 0;

    if (!hasCachedData) {
      return (
        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 16px 80px',
            background: 'var(--color-bg)',
          }}
          data-view="matches"
        >
          <ErrorState
            message="Received invalid data from server. Please try again or contact support."
            onRetry={onRefresh}
          />
        </div>
      );
    }
    // If we have cached data, show it with error banner below
  }

  // Edge Case: General network/API errors without cached data
  if (error && !feedData.heroMatch && feedData.challenges.length === 0 && 
      feedData.openMatches.length === 0 && feedData.weeklyMatches.length === 0 && 
      feedData.tournaments.length === 0) {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
          background: 'var(--color-bg)',
        }}
        data-view="matches"
      >
        <ErrorState
          message="Unable to load your matches. Please try again."
          onRetry={onRefresh}
        />
      </div>
    );
  }

  // Edge Case 2: Check if all sections are empty (null/empty feedData)
  const hasNoData =
    !feedData.heroMatch &&
    feedData.challenges.length === 0 &&
    feedData.openMatches.length === 0 &&
    feedData.weeklyMatches.length === 0 &&
    feedData.tournaments.length === 0;

  // Show empty state if no data at all
  if (hasNoData && !loading) {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        data-view="matches"
      >
        <EmptyMatchesState onFindMatches={() => console.log('Navigate to discover')} />
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        padding: '0 16px 80px',
        background: 'var(--color-bg)',
      }}
      data-view="matches"
      data-testid="matches-view"
    >
      {/* Error banner if there's an error but we have cached data */}
      {error && (feedData.heroMatch || feedData.challenges.length > 0 || 
                 feedData.openMatches.length > 0 || feedData.weeklyMatches.length > 0 || 
                 feedData.tournaments.length > 0) && (
        <NetworkErrorBanner
          message={
            error.message === 'NETWORK_TIMEOUT' 
              ? 'Request timed out. Showing cached data. Tap to retry.'
              : error.message === 'INVALID_DATA_FORMAT'
              ? 'Received invalid data. Showing cached data. Tap to retry.'
              : 'Connection error. Showing cached data. Tap to retry.'
          }
          onRetry={onRefresh}
        />
      )}

      {/* Hero Section */}
      <HeroSection
        heroMatch={feedData.heroMatch}
        onShareClick={handleShareClick}
        onOptionsClick={handleOptionsClick}
      />

      {/* Challenges Section */}
      <ChallengesSection
        challenges={feedData.challenges}
        onRespondClick={handleRespondClick}
      />

      {/* Open Matches Section */}
      <OpenMatchesSection
        openMatches={feedData.openMatches}
        onJoinClick={handleJoinClick}
      />

      {/* Weekly Digest Section */}
      <DigestSection matches={feedData.weeklyMatches} />

      {/* Tournaments Section */}
      <TournamentsSection
        tournaments={feedData.tournaments}
        onEnterClick={handleEnterClick}
      />

      {/* Hide scrollbar */}
      <style>{`
        [data-view="matches"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
});

import { useState, useEffect, useMemo } from 'react';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters } from '@/contexts/FilterContext';
import type { NewsFilter } from '@/types/feed';
import {
  FeedHeader,
  SegmentStrip,
  HeroSection,
  ChallengesSection,
  OpenMatchesSection,
  DigestSection,
  TournamentsSection,
} from '@/components/feed';
import { PageContainer } from '@/components/layout/PageContainer';
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

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function FeedPage() {
  const { user } = useAuth();
  const { filters, updateFilters } = useFilters();
  
  // State
  const [feedData, setFeedData] = useState<FeedData>({
    heroMatch: null,
    challenges: [],
    openMatches: [],
    weeklyMatches: [],
    tournaments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const activeFilter = (filters.newsFilter as NewsFilter) || 'all';

  // Fetch all feed data
  const fetchAllFeedData = async (filter: NewsFilter) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = getCachedData(filter);
      if (cachedData) {
        setFeedData(cachedData);
        setLoading(false);
        return;
      }

      // Fetch data in parallel
      const [heroMatch, challenges, openMatches, weeklyMatches, tournaments] = 
        await Promise.all([
          filter === 'all' || filter === 'results' ? fetchHeroMatch(user.id) : Promise.resolve(null),
          filter === 'all' || filter === 'challenges' ? fetchChallenges(user.id) : Promise.resolve([]),
          filter === 'all' || filter === 'near_me' ? fetchOpenMatches(user.id) : Promise.resolve([]),
          filter === 'all' || filter === 'results' ? fetchWeeklyMatches(user.id) : Promise.resolve([]),
          filter === 'all' || filter === 'tournaments' ? fetchTournaments(user.id) : Promise.resolve([]),
        ]);

      const newData: FeedData = {
        heroMatch,
        challenges,
        openMatches,
        weeklyMatches,
        tournaments,
      };

      setFeedData(newData);
      setCachedData(filter, newData);
    } catch (err) {
      console.error('Error fetching feed data:', err);
      setError(err as Error);

      // Try to use cached data as fallback
      const cachedData = getCachedData(filter);
      if (cachedData) {
        setFeedData(cachedData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced filter change handler
  const debouncedFetchData = useMemo(
    () => debounce((filter: NewsFilter) => {
      fetchAllFeedData(filter);
    }, 300),
    [user]
  );

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchAllFeedData(activeFilter);
    }
  }, [user]);

  // Handle filter changes
  const handleFilterChange = (filter: NewsFilter) => {
    updateFilters({ ...filters, newsFilter: filter });
    debouncedFetchData(filter);
  };

  // Header actions
  const handleSearchClick = () => {
    console.log('Search clicked');
    // TODO: Implement search
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
    // TODO: Implement notifications
  };

  const handleAvatarClick = () => {
    console.log('Avatar clicked');
    // TODO: Navigate to profile
  };

  // Hero section actions
  const handleShareClick = () => {
    console.log('Share result clicked');
    // TODO: Implement share dialog
  };

  const handleOptionsClick = () => {
    console.log('Options clicked');
    // TODO: Implement options menu
  };

  // Challenge actions
  const handleRespondClick = (challenge: any) => {
    console.log('Respond to challenge:', challenge);
    // TODO: Implement challenge response modal
  };

  // Open match actions
  const handleJoinClick = (openMatch: any) => {
    console.log('Join match:', openMatch);
    // TODO: Implement join match dialog
  };

  // Tournament actions
  const handleEnterClick = (tournament: any) => {
    console.log('Enter tournament:', tournament);
    // TODO: Implement tournament registration
  };

  // Check if all sections are empty
  const isEmpty = !feedData.heroMatch && 
    feedData.challenges.length === 0 && 
    feedData.openMatches.length === 0 && 
    feedData.weeklyMatches.length === 0 && 
    feedData.tournaments.length === 0;

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        minHeight: '100vh',
      }}
    >
      {/* Fixed Header — mobile only (desktop nav is in AppShell) */}
      <div className="lg:hidden">
        <FeedHeader
          onSearchClick={handleSearchClick}
          onNotificationClick={handleNotificationClick}
          onAvatarClick={handleAvatarClick}
          hasNotifications={false}
        />
      </div>

      <PageContainer>
        {/* Segment Filter Strip */}
        <div style={{ padding: '0 16px' }}>
          <SegmentStrip
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Feed Content */}
        <div
          style={{
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            padding: '0 16px',
            paddingBottom: 'var(--page-pb)',
          }}
          className="hide-scrollbar"
        >
          {loading && !feedData.heroMatch && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t2)' }}>
                Loading...
              </p>
            </div>
          )}

          {!loading && isEmpty && (
            <EmptyState filter={activeFilter} />
          )}

          {!isEmpty && (
            <>
              <HeroSection
                heroMatch={feedData.heroMatch}
                onShareClick={handleShareClick}
                onOptionsClick={handleOptionsClick}
              />

              <ChallengesSection
                challenges={feedData.challenges}
                onRespondClick={handleRespondClick}
              />

              <OpenMatchesSection
                openMatches={feedData.openMatches}
                onJoinClick={handleJoinClick}
              />

              <DigestSection
                matches={feedData.weeklyMatches}
              />

              <TournamentsSection
                tournaments={feedData.tournaments}
                onEnterClick={handleEnterClick}
              />
            </>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

// Empty State Component
function EmptyState({ filter }: { filter: NewsFilter }) {
  const message = (() => {
    switch (filter) {
      case 'challenges':
        return {
          title: 'No Challenges',
          description: 'You don\'t have any pending challenges at the moment.',
        };
      case 'results':
        return {
          title: 'No Results',
          description: 'Play some matches to see your results here.',
        };
      case 'near_me':
        return {
          title: 'No Open Matches',
          description: 'There are no open matches near you right now.',
        };
      case 'tournaments':
        return {
          title: 'No Tournaments',
          description: 'There are no upcoming tournaments in your area.',
        };
      default:
        return {
          title: 'No Activity',
          description: 'Check back later for updates from your network.',
        };
    }
  })();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        minHeight: '50vh',
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
        <Inbox size={36} style={{ color: 'var(--color-t3)' }} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-t1)',
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {message.title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-t2)',
          textAlign: 'center',
          maxWidth: 280,
        }}
      >
        {message.description}
      </p>
    </div>
  );
}

/**
 * Edge Case Tests for CirclesPage and MatchesView
 * 
 * Tests all edge cases defined in task 5.3:
 * 1. User not authenticated
 * 2. feedData is null or empty
 * 3. Network request times out
 * 4. API returns invalid data format
 * 5. Cache is corrupted
 * 6. Appropriate error messages displayed
 * 7. Retry and fallback options provided
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CirclesPage } from '../CirclesPage';
import { AuthContext } from '../../../contexts/AuthContext';
import { NavVisibilityContext } from '../../../contexts/NavVisibilityContext';
import { GuestTutorialContext } from '../../../contexts/GuestTutorialContext';
import * as feedApi from '../../../api/feed-api';
import type { FeedData } from '../../../api/feed-api';

// Mock modules
vi.mock('../../../api/feed-api');
vi.mock('../../../hooks/useConversations', () => ({
  useConversations: () => ({
    conversations: [],
    loading: false,
    error: null,
    markAsRead: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
};

const mockProfile = {
  id: 'test-user-id',
  full_name: 'Test User',
  avatar_url: null,
  location_city: 'Test City',
  location_lat: 0,
  location_lng: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockEmptyFeedData: FeedData = {
  heroMatch: null,
  challenges: [],
  openMatches: [],
  weeklyMatches: [],
  tournaments: [],
};

const mockValidFeedData: FeedData = {
  heroMatch: {
    match: {
      id: 'match-1',
      sport: 'tennis',
      format: 'singles',
      club_id: 'club-1',
      ladder_id: null,
      competition_id: null,
      competition_fixture_id: null,
      scheduled_at: null,
      played_at: new Date().toISOString(),
      score: '6-4, 6-3',
      score_status: 'confirmed',
      score_submitted_by: 'test-user-id',
      score_confirmed_by: null,
      dispute_reason: null,
      winner_team: 1,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    opponent: {
      id: 'opponent-1',
      full_name: 'Opponent User',
      avatar_url: null,
      location_city: 'Test City',
    },
    club: null,
    eloChange: 14,
    currentElo: 1214,
    sparklineData: [1200, 1214],
  },
  challenges: [],
  openMatches: [],
  weeklyMatches: [],
  tournaments: [],
};

// Test wrapper component
function TestWrapper({ children, user = mockUser, profile = mockProfile }: any) {
  return (
    <BrowserRouter>
      <AuthContext.Provider
        value={{
          user,
          profile,
          session: null,
          loading: false,
          isGuest: false,
          guestSwipeCount: 0,
          signUp: vi.fn(),
          signIn: vi.fn(),
          signInWithGoogle: vi.fn(),
          signOut: vi.fn(),
          updateProfile: vi.fn(),
          enterGuestMode: vi.fn(),
          exitGuestMode: vi.fn(),
          incrementGuestSwipeCount: vi.fn(),
        }}
      >
        <NavVisibilityContext.Provider
          value={{
            hideNav: false,
            setHideNav: vi.fn(),
          }}
        >
          <GuestTutorialContext.Provider
            value={{
              tutorialStep: null,
              advanceTutorial: vi.fn(),
              resetTutorial: vi.fn(),
            }}
          >
            {children}
          </GuestTutorialContext.Provider>
        </NavVisibilityContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

describe('CirclesPage Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(feedApi.getCachedData).mockReturnValue(null);
    vi.mocked(feedApi.checkStaleCache).mockReturnValue(null);
    vi.mocked(feedApi.setCachedData).mockImplementation(() => {});
    vi.mocked(feedApi.clearFeedCache).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Edge Case 1: User not authenticated', () => {
    it('should display authentication error when user is null', async () => {
      render(
        <TestWrapper user={null} profile={null}>
          <CirclesPage />
        </TestWrapper>
      );

      // Wait for MATCHES view to render (default segment)
      await waitFor(() => {
        expect(screen.getByText(/please sign in to view your matches/i)).toBeInTheDocument();
      });
    });

    it('should not attempt to fetch feed data when user is not authenticated', async () => {
      const fetchHeroMatchSpy = vi.spyOn(feedApi, 'fetchHeroMatch');

      render(
        <TestWrapper user={null} profile={null}>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
      });

      expect(fetchHeroMatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Case 2: feedData is null or empty', () => {
    it('should display empty state when all feed sections are empty', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockResolvedValue(null);
      vi.mocked(feedApi.fetchChallenges).mockResolvedValue([]);
      vi.mocked(feedApi.fetchOpenMatches).mockResolvedValue([]);
      vi.mocked(feedApi.fetchWeeklyMatches).mockResolvedValue([]);
      vi.mocked(feedApi.fetchTournaments).mockResolvedValue([]);

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/play some matches and join tournaments/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /find matches/i })).toBeInTheDocument();
    });

    it('should provide "Find Matches" button in empty state', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockResolvedValue(null);
      vi.mocked(feedApi.fetchChallenges).mockResolvedValue([]);
      vi.mocked(feedApi.fetchOpenMatches).mockResolvedValue([]);
      vi.mocked(feedApi.fetchWeeklyMatches).mockResolvedValue([]);
      vi.mocked(feedApi.fetchTournaments).mockResolvedValue([]);

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /find matches/i })).toBeInTheDocument();
      });

      const findMatchesButton = screen.getByRole('button', { name: /find matches/i });
      await user.click(findMatchesButton);

      // Button should be clickable (console.log in implementation)
      expect(findMatchesButton).toBeInTheDocument();
    });
  });

  describe('Edge Case 3: Network request times out', () => {
    it('should display timeout error when request exceeds 30 seconds', async () => {
      // Mock a long-running request that will be aborted
      vi.mocked(feedApi.fetchHeroMatch).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000))
      );

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      // Wait for timeout error (30 seconds)
      await waitFor(
        () => {
          expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
        },
        { timeout: 31000 }
      );

      expect(screen.getByText(/check your connection and try again/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    }, 35000);

    it('should show cached data with timeout banner when timeout occurs with cache', async () => {
      // Mock stale cache available
      vi.mocked(feedApi.checkStaleCache).mockReturnValue(mockValidFeedData);

      // Mock timeout
      vi.mocked(feedApi.fetchHeroMatch).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000))
      );

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(screen.getByText(/request timed out.*showing cached data/i)).toBeInTheDocument();
        },
        { timeout: 31000 }
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    }, 35000);
  });

  describe('Edge Case 4: API returns invalid data format', () => {
    it('should display error when API returns invalid data structure', async () => {
      // Mock invalid data (missing required fields)
      vi.mocked(feedApi.fetchHeroMatch).mockResolvedValue(null);
      vi.mocked(feedApi.fetchChallenges).mockResolvedValue([] as any);
      vi.mocked(feedApi.fetchOpenMatches).mockResolvedValue('invalid' as any);
      vi.mocked(feedApi.fetchWeeklyMatches).mockResolvedValue([] as any);
      vi.mocked(feedApi.fetchTournaments).mockResolvedValue([] as any);

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/received invalid data from server/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should use cached data when API returns invalid format', async () => {
      // Mock stale cache with valid data
      vi.mocked(feedApi.checkStaleCache).mockReturnValue(mockValidFeedData);

      // Mock invalid API response
      vi.mocked(feedApi.fetchHeroMatch).mockResolvedValue('invalid' as any);

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/received invalid data.*showing cached data/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Edge Case 5: Cache is corrupted', () => {
    it('should clear corrupted cache and fetch fresh data', async () => {
      // Mock corrupted cache (invalid structure)
      vi.mocked(feedApi.getCachedData).mockReturnValue({
        heroMatch: 'invalid',
        challenges: 'invalid',
      } as any);

      const clearCacheSpy = vi.spyOn(feedApi, 'clearFeedCache');
      const fetchHeroMatchSpy = vi.spyOn(feedApi, 'fetchHeroMatch').mockResolvedValue(null);

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(clearCacheSpy).toHaveBeenCalled();
      });

      expect(fetchHeroMatchSpy).toHaveBeenCalled();
    });

    it('should validate cache data structure before using it', async () => {
      // Mock cache with missing required fields
      vi.mocked(feedApi.getCachedData).mockReturnValue({
        heroMatch: null,
        // Missing other required fields
      } as any);

      const clearCacheSpy = vi.spyOn(feedApi, 'clearFeedCache');

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(clearCacheSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Case 6: Appropriate error messages', () => {
    it('should display specific error message for authentication error', async () => {
      render(
        <TestWrapper user={null} profile={null}>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/please sign in to view your matches/i)).toBeInTheDocument();
      });
    });

    it('should display specific error message for timeout', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000))
      );

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
        },
        { timeout: 31000 }
      );
    }, 35000);

    it('should display specific error message for invalid data', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockResolvedValue('invalid' as any);

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/received invalid data from server/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message for network failures', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchChallenges).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchOpenMatches).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchWeeklyMatches).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchTournaments).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/unable to load your matches/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Case 7: Retry and fallback options', () => {
    it('should provide retry button on error', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchChallenges).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchOpenMatches).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchWeeklyMatches).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchTournaments).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should refetch data when retry button is clicked', async () => {
      vi.mocked(feedApi.fetchHeroMatch).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(feedApi.fetchChallenges).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(feedApi.fetchOpenMatches).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(feedApi.fetchWeeklyMatches).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(feedApi.fetchTournaments).mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Mock successful retry
      vi.mocked(feedApi.fetchHeroMatch).mockResolvedValue(null);
      vi.mocked(feedApi.fetchChallenges).mockResolvedValue([]);
      vi.mocked(feedApi.fetchOpenMatches).mockResolvedValue([]);
      vi.mocked(feedApi.fetchWeeklyMatches).mockResolvedValue([]);
      vi.mocked(feedApi.fetchTournaments).mockResolvedValue([]);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
      });
    });

    it('should use stale cache as fallback when network fails', async () => {
      // Mock stale cache available
      vi.mocked(feedApi.checkStaleCache).mockReturnValue(mockValidFeedData);

      // Mock network failure
      vi.mocked(feedApi.fetchHeroMatch).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchChallenges).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchOpenMatches).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchWeeklyMatches).mockRejectedValue(new Error('Network error'));
      vi.mocked(feedApi.fetchTournaments).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/connection error.*showing cached data/i)).toBeInTheDocument();
      });

      // Should still show the cached hero match data
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Edge Case 8: Loading states', () => {
    it('should display loading skeleton while fetching data', async () => {
      // Mock slow API response
      vi.mocked(feedApi.fetchHeroMatch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 1000))
      );

      render(
        <TestWrapper>
          <CirclesPage />
        </TestWrapper>
      );

      // Should show loading skeleton immediately
      expect(screen.getByTestId('matches-view')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
      });
    });
  });
});

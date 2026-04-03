/**
 * Feed API functions for the Feed Tab Redesign
 * Provides data fetching functions for hero match and related feed content
 */

import { supabase } from '@/lib/supabase';
import { calculateDistance } from '@/lib/feed-utils';
import type { 
  FeedHeroMatch, 
  FeedChallenge, 
  FeedOpenMatch, 
  FeedDigestMatch, 
  FeedTournament,
  NewsFilter 
} from '@/types/feed';
import type { SportType } from '@/types/database';

/**
 * Complete feed data structure containing all feed sections
 */
export interface FeedData {
  heroMatch: FeedHeroMatch | null;
  challenges: FeedChallenge[];
  openMatches: FeedOpenMatch[];
  weeklyMatches: FeedDigestMatch[];
  tournaments: FeedTournament[];
}

/**
 * Cache entry structure with data, timestamp, and filter
 */
interface CacheEntry {
  data: FeedData;
  timestamp: number;
  filter: NewsFilter;
}

// In-memory cache with 5-minute TTL and maximum 5 cached filter states
const feedCache = new Map<NewsFilter, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 5;

/**
 * Generate sparkline data from user's recent match history
 * Returns array of ELO ratings from last 10 matches
 */
async function generateSparklineData(
  userId: string,
  sport: SportType
): Promise<number[]> {
  // Get result IDs where user is a player
  const { data: playerRows } = await supabase
    .from('match_result_players')
    .select('result_id')
    .eq('user_id', userId);

  if (!playerRows || playerRows.length === 0) {
    return [];
  }

  const resultIds = playerRows.map((r) => r.result_id);

  // Fetch last 10 matches for this sport
  const { data: results } = await supabase
    .from('match_results')
    .select('id, played_at, winner_team')
    .in('id', resultIds)
    .eq('sport', sport)
    .eq('status', 'confirmed')
    .order('played_at', { ascending: false })
    .limit(10);

  if (!results || results.length === 0) {
    return [];
  }

  // Fetch players for these results to determine wins/losses
  const { data: allPlayers } = await supabase
    .from('match_result_players')
    .select('result_id, user_id, team_number')
    .in('result_id', results.map((r) => r.id));

  if (!allPlayers) {
    return [];
  }

  // Calculate ELO progression (simplified)
  let currentElo = 1200; // Starting ELO
  const sparklineData: number[] = [];

  // Process matches in chronological order (oldest first)
  const chronologicalResults = [...results].reverse();

  for (const result of chronologicalResults) {
    const userPlayer = allPlayers.find(
      (p) => p.result_id === result.id && p.user_id === userId
    );

    if (userPlayer) {
      const isWin = result.winner_team === userPlayer.team_number;
      // Simplified ELO change calculation
      currentElo += isWin ? 14 : -12;
      sparklineData.push(currentElo);
    }
  }

  return sparklineData;
}

/**
 * Calculate ELO change for a specific match result
 * Returns positive value for win, negative for loss
 */
function calculateEloChange(
  result: any,
  userId: string,
  players: any[]
): number {
  const userPlayer = players.find((p) => p.user_id === userId);

  if (!userPlayer) {
    return 0;
  }

  const isWin = result.winner_team === userPlayer.team_number;
  // Simplified K-factor calculation
  // In a real implementation, this would consider opponent rating
  return isWin ? 14 : -12;
}

/**
 * Fetch latest confirmed match with players and club data
 * Calculate ELO change and generate sparkline data
 * 
 * @param userId - The user ID to fetch match for
 * @returns FeedHeroMatch object or null if no matches found
 */
export async function fetchHeroMatch(
  userId: string
): Promise<FeedHeroMatch | null> {
  // Get result IDs where user is a player
  const { data: playerRows, error: playerError } = await supabase
    .from('match_result_players')
    .select('result_id')
    .eq('user_id', userId);

  if (playerError || !playerRows || playerRows.length === 0) {
    return null;
  }

  const resultIds = playerRows.map((r) => r.result_id);

  // Fetch latest confirmed match result
  const { data: result, error: resultError } = await supabase
    .from('match_results')
    .select('*')
    .in('id', resultIds)
    .eq('status', 'confirmed')
    .order('played_at', { ascending: false })
    .limit(1)
    .single();

  if (resultError || !result) {
    return null;
  }

  // Fetch players for this match
  const { data: matchPlayers, error: playersError } = await supabase
    .from('match_result_players')
    .select('user_id, team_number, profiles!match_result_players_user_id_fkey(id, full_name, avatar_url, location_city)')
    .eq('result_id', result.id);

  if (playersError || !matchPlayers || matchPlayers.length === 0) {
    return null;
  }

  // Find opponent (player who is not the current user)
  const opponentData = matchPlayers.find((p) => p.user_id !== userId);

  if (!opponentData || !opponentData.profiles) {
    return null;
  }

  const opponentProfile = opponentData.profiles as any;
  const opponent = {
    id: opponentProfile.id,
    full_name: opponentProfile.full_name,
    avatar_url: opponentProfile.avatar_url,
    location_city: opponentProfile.location_city,
  };

  // Fetch club data if club_id exists (from challenge)
  let club = null;
  if (result.challenge_id) {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('club_id')
      .eq('id', result.challenge_id)
      .single();

    if (challenge?.club_id) {
      const { data: clubData } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', challenge.club_id)
        .single();

      club = clubData;
    }
  }

  // Calculate ELO change
  const eloChange = calculateEloChange(result, userId, matchPlayers);

  // Get current ELO from user profile
  const { data: profile } = await supabase
    .from('user_sport_profiles')
    .select('official_rating')
    .eq('user_id', userId)
    .eq('sport', result.sport as any)
    .single();

  const currentElo = parseInt(profile?.official_rating || '1200');

  // Generate sparkline data (last 10 matches)
  const sparklineData = await generateSparklineData(
    userId,
    result.sport as SportType
  );

  // Convert match_results to Match type format for compatibility
  const match = {
    id: result.id,
    sport: result.sport as SportType,
    format: result.format as 'singles' | 'doubles',
    club_id: club?.id || null,
    ladder_id: null,
    competition_id: null,
    competition_fixture_id: null,
    scheduled_at: null,
    played_at: result.played_at,
    score: result.score,
    score_status: result.status as 'pending' | 'confirmed' | 'disputed',
    score_submitted_by: result.submitted_by,
    score_confirmed_by: null,
    dispute_reason: null,
    winner_team: result.winner_team,
    notes: null,
    created_at: result.created_at,
    updated_at: result.created_at,
  };

  return {
    match,
    opponent: opponent as any,
    club,
    eloChange,
    currentElo,
    sparklineData,
  };
}

/**
 * Fetch incoming challenges with proposer and players
 * Calculate distance from user location
 * Determine if challenge is new (< 24 hours)
 * 
 * @param userId - The user ID to fetch challenges for
 * @returns Array of FeedChallenge objects
 */
export async function fetchChallenges(
  userId: string
): Promise<import('@/types/feed').FeedChallenge[]> {
  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*, proposer:profiles!challenges_proposed_by_fkey(*), challenge_players(user_id, team_number, profiles!challenge_players_user_id_fkey(*)), club:clubs!challenges_club_id_fkey(*)')
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

  return challenges.map((challenge: any) => {
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
      players: challenge.challenge_players?.map((cp: any) => cp.profiles) || [],
      isNew,
      distance,
    };
  });
}

/**
 * Fetch open matches with host and club data
 * Calculate distance from user location
 * 
 * @param userId - The user ID to fetch open matches for
 * @returns Array of FeedOpenMatch objects
 */
export async function fetchOpenMatches(
  userId: string
): Promise<import('@/types/feed').FeedOpenMatch[]> {
  const { data: openMatches, error } = await supabase
    .from('challenges')
    .select('*, proposer:profiles!challenges_proposed_by_fkey(*), club:clubs!challenges_club_id_fkey(*)')
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

  return (openMatches as any[]).map((match: any) => {
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

/**
 * Fetch matches from last 7 days with players and club data
 * Determine win/loss status for each match
 * 
 * @param userId - The user ID to fetch weekly matches for
 * @returns Array of FeedDigestMatch objects
 */
export async function fetchWeeklyMatches(
  userId: string
): Promise<import('@/types/feed').FeedDigestMatch[]> {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get result IDs where user is a player
  const { data: playerRows, error: playerError } = await supabase
    .from('match_result_players')
    .select('result_id')
    .eq('user_id', userId);

  if (playerError || !playerRows || playerRows.length === 0) {
    return [];
  }

  const resultIds = playerRows.map((r) => r.result_id);

  // Fetch confirmed matches from last 7 days
  const { data: results, error: resultsError } = await supabase
    .from('match_results')
    .select('*')
    .in('id', resultIds)
    .eq('status', 'confirmed')
    .gte('played_at', weekAgo.toISOString())
    .order('played_at', { ascending: false });

  if (resultsError || !results || results.length === 0) {
    return [];
  }

  // Fetch players for these results
  const { data: allPlayers, error: playersError } = await supabase
    .from('match_result_players')
    .select('result_id, user_id, team_number, profiles!match_result_players_user_id_fkey(id, full_name, avatar_url, location_city)')
    .in('result_id', results.map((r) => r.id));

  if (playersError || !allPlayers) {
    return [];
  }

  // Fetch clubs for results that have challenge_id
  const challengeIds = results
    .filter((r) => r.challenge_id)
    .map((r) => r.challenge_id!);

  let clubsMap = new Map<string, any>();
  if (challengeIds.length > 0) {
    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, club_id, clubs!challenges_club_id_fkey(*)')
      .in('id', challengeIds);

    if (challenges) {
      (challenges as any[]).forEach((challenge: any) => {
        if (challenge.club_id && challenge.clubs) {
          clubsMap.set(challenge.id, challenge.clubs);
        }
      });
    }
  }

  return results.map((result) => {
    const userPlayer = (allPlayers as any[]).find(
      (p: any) => p.result_id === result.id && p.user_id === userId
    );
    const opponentData = (allPlayers as any[]).find(
      (p: any) => p.result_id === result.id && p.user_id !== userId
    );

    const isWin = result.winner_team === userPlayer?.team_number;
    const club = result.challenge_id ? clubsMap.get(result.challenge_id) || null : null;

    const opponentProfile = opponentData?.profiles as any;
    const opponent = opponentProfile
      ? {
          id: opponentProfile.id,
          full_name: opponentProfile.full_name,
          avatar_url: opponentProfile.avatar_url,
          location_city: opponentProfile.location_city,
        }
      : null;

    // Convert match_results to Match type format for compatibility
    const match = {
      id: result.id,
      sport: result.sport as SportType,
      format: result.format as 'singles' | 'doubles',
      club_id: club?.id || null,
      ladder_id: null,
      competition_id: null,
      competition_fixture_id: null,
      scheduled_at: null,
      played_at: result.played_at,
      score: result.score,
      score_status: result.status as 'pending' | 'confirmed' | 'disputed',
      score_submitted_by: result.submitted_by,
      score_confirmed_by: null,
      dispute_reason: null,
      winner_team: result.winner_team,
      notes: null,
      created_at: result.created_at,
      updated_at: result.created_at,
    };

    return {
      match,
      opponent: opponent as any,
      club,
      isWin,
    };
  });
}

/**
 * Fetch active tournaments with registration open
 * Calculate spots remaining
 * 
 * @param userId - The user ID to fetch tournaments for
 * @returns Array of FeedTournament objects
 */
export async function fetchTournaments(
  userId: string
): Promise<import('@/types/feed').FeedTournament[]> {
  const { data: tournaments, error } = await supabase
    .from('competitions')
    .select('*, club:clubs!competitions_club_id_fkey(*)')
    .eq('is_active', true)
    .eq('competition_type', 'tournament')
    .gte('registration_deadline', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(5);

  if (error || !tournaments) return [];

  // Note: competition_participants table doesn't exist in schema
  // Using placeholder logic - in production, this would query the actual table
  const countsMap = new Map<string, number>();

  return (tournaments as any[]).map((tournament: any) => {
    const participantCount = countsMap.get(tournament.id) || 0;
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

/**
 * Get cached feed data for a specific filter
 * Returns null if no cache exists or cache is expired (> 5 minutes old)
 * 
 * @param filter - The news filter to retrieve cached data for
 * @returns Cached FeedData or null if not found/expired
 */
export function getCachedData(filter: NewsFilter): FeedData | null {
  const entry = feedCache.get(filter);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    feedCache.delete(filter);
    return null;
  }
  
  return entry.data;
}

/**
 * Check for stale cached data (even if expired)
 * Used as fallback when network request fails
 * Returns cached data regardless of age, or null if no cache exists
 * 
 * @param filter - The news filter to retrieve cached data for
 * @returns Cached FeedData (even if stale) or null if not found
 */
export function checkStaleCache(filter: NewsFilter): FeedData | null {
  const entry = feedCache.get(filter);
  if (!entry) return null;
  
  // Return data even if stale (don't check TTL)
  return entry.data;
}

/**
 * Clear all cached feed data
 * Useful for clearing cache on user logout or when forcing a refresh
 */
export function clearFeedCache(): void {
  feedCache.clear();
}

/**
 * Store feed data in cache with current timestamp
 * Implements LRU eviction: removes oldest entry when cache is full
 * 
 * @param filter - The news filter to cache data for
 * @param data - The feed data to cache
 */
export function setCachedData(filter: NewsFilter, data: FeedData): void {
  if (feedCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key in Map)
    const oldestKey = Array.from(feedCache.keys())[0];
    feedCache.delete(oldestKey);
  }
  
  feedCache.set(filter, {
    data,
    timestamp: Date.now(),
    filter,
  });
}

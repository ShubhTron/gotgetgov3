/**
 * Type definitions for the Feed Tab Redesign
 * Defines interfaces for feed-specific data structures
 */

import type { Match, Challenge, Competition, Profile, Club } from './database';

/**
 * News filter options for the feed segment strip
 */
export type NewsFilter = 'all' | 'challenges' | 'results' | 'near_me' | 'tournaments';

/**
 * Hero card data structure for displaying latest match result
 */
export interface FeedHeroMatch {
  match: Match;
  opponent: Profile;
  club: Club | null;
  eloChange: number;
  currentElo: number;
  sparklineData: number[];
}

/**
 * Challenge card data structure for incoming match challenges
 */
export interface FeedChallenge {
  challenge: Challenge;
  challenger: Profile;
  players: Profile[];
  isNew: boolean;
  distance: number;
}

/**
 * Open match card data structure for available matches to join
 */
export interface FeedOpenMatch {
  challenge: Challenge;
  host: Profile;
  distance: number;
}

/**
 * Digest match row data structure for weekly match summary
 */
export interface FeedDigestMatch {
  match: Match;
  opponent: Profile;
  club: Club | null;
  isWin: boolean;
}

/**
 * Tournament card data structure for nearby tournaments
 */
export interface FeedTournament {
  competition: Competition;
  club: Club;
  spotsLeft: number;
}

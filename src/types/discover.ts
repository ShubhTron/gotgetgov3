import type { SportType } from './index';

export interface MatchRecord {
  id: string;
  result: 'W' | 'L';
  opponentName: string;
  score: string;     // pre-formatted e.g. "6–3  6–2"
  date: string;      // pre-formatted e.g. "Mar 12"
}

export interface DiscoverPlayer {
  id: string;
  fullName: string;
  avatarUrl?: string;
  sport: SportType;
  sportName: string;
  level: string;
  levelLabel: string;
  distanceKm: number;
  lastSeen?: string;
  isActiveRecently: boolean;
  availability: string;
  preferredTime: string;
  homeClub: string;
  scheduleOverlapLabel: string;
  playStyle?: string;
  compatibilityScore: number;
  recentMatches: MatchRecord[];
  // Extended fields used by DiscoveryCard / FullscreenView
  verified?: boolean;
  age?: number | string;
  distance?: number;
  rating?: string | number;
  ratingSystem?: string;
  eloRating?: number;
  mutualConnections?: number;
  responseRate?: string;
  clubIds?: string[];
  locationCity?: string;
  locationCountry?: string;
  availabilityOverlap?: number;
  matchCompletionRate?: number;
}

/** Alias used by DiscoveryCard, FullscreenView, etc. */
export type Player = DiscoverPlayer;

export interface Club {
  id: string;
  name: string;
  coverImageUrl?: string;
  [key: string]: unknown;
}

export interface Coach {
  id: string;
  fullName: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface Competition {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Event {
  id: string;
  name: string;
  [key: string]: unknown;
}

export type FilterSport = SportType | 'all';
export type FilterSkill = 'any' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'professional';

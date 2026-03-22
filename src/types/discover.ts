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
}

export type FilterSport = SportType | 'all';
export type FilterSkill = 'any' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'professional';

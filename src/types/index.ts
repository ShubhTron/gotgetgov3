export * from './database';
export type { MatchRecord, DiscoverPlayer, Player, Coach, FilterSport, FilterSkill } from './discover';
export type { ConnectionRequestStatus, ConnectionRequestWithProfile, CreateConnectionRequestResponse, ConnectionRequestListResponse, AcceptConnectionRequestResponse, RejectConnectionRequestResponse, CancelConnectionRequestResponse } from './connectionRequests';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

export interface SportInfo {
  id: string;
  name: string;
  icon: string;
  officialRatingSystem?: string;
}

export const SPORTS = {
  platform_tennis: {
    id: 'platform_tennis',
    name: 'Platform Tennis',
    icon: 'racquet',
    officialRatingSystem: 'PTI',
  },
  padel: {
    id: 'padel',
    name: 'Padel',
    icon: 'racquet',
    officialRatingSystem: undefined,
  },
  tennis: {
    id: 'tennis',
    name: 'Tennis',
    icon: 'racquet',
    officialRatingSystem: 'UTR',
  },
  squash: {
    id: 'squash',
    name: 'Squash',
    icon: 'racquet',
    officialRatingSystem: 'SquashLevels',
  },
  pickleball: {
    id: 'pickleball',
    name: 'Pickleball',
    icon: 'racquet',
    officialRatingSystem: 'DUPR',
  },
  beach_tennis: {
    id: 'beach_tennis',
    name: 'Beach Tennis',
    icon: 'racquet',
    officialRatingSystem: undefined,
  },
} satisfies Record<string, SportInfo>;

export const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
  { value: 'professional', label: 'Professional' },
];

export type TabId = 'discover' | 'news' | 'schedule' | 'circles';

export interface Tab {
  id: TabId;
  label: string;
  path: string;
}

export const TABS: Tab[] = [
  { id: 'discover', label: 'Discover', path: '/discover' },
  { id: 'news',     label: 'News',     path: '/news' },
  { id: 'schedule', label: 'Schedule', path: '/schedule' },
  { id: 'circles',  label: 'Circles',  path: '/circles' },
];

export type SportType = keyof typeof SPORTS;

export interface MatchResult {
  id: string;
  challengeId?: string;
  sport: SportType;
  format: 'singles' | 'doubles';
  playedAt: string;
  score: { sets: { team1: number; team2: number }[]; formatted: string };
  winnerTeam: 1 | 2 | null;
  submittedBy: string;
  status: 'pending' | 'confirmed' | 'disputed';
  players: { userId: string; teamNumber: 1 | 2; name: string; avatarUrl?: string }[];
}

export interface PendingScoreMatch {
  challengeId: string;
  sport: SportType;
  format: 'singles' | 'doubles';
  confirmedTime: string;
  opponent: { id: string; name: string; avatarUrl?: string };
  partner?: { id: string; name: string; avatarUrl?: string };
  opponent2?: { id: string; name: string; avatarUrl?: string };
}

export interface SubmitMatchResultPayload {
  challengeId?: string;
  sport: SportType;
  format: 'singles' | 'doubles';
  playedAt: string;
  score: { sets: { team1: number; team2: number }[]; formatted: string };
  winnerTeam: 1 | 2 | null;
  players: { userId: string; teamNumber: 1 | 2 }[];
}

export interface ScoringError {
  message: string;
  code?: string;
}

export interface SportScoringConfig {
  type: 'sets' | 'games' | 'points';
  defaultSets: number;
  maxPoints: number;
  winByTwo: boolean;
  label: string;
}

export interface SportFormatConfig {
  defaultFormat: 'singles' | 'doubles';
  doublesOnly: boolean;
}

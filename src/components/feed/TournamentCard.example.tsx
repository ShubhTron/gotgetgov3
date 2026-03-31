/**
 * TournamentCard Example
 * Demonstrates the TournamentCard component with sample data
 */

import { TournamentCard } from './TournamentCard';
import type { FeedTournament } from '@/types/feed';

// Sample tournament data
const sampleTournament: FeedTournament = {
  competition: {
    id: '1',
    name: 'Spring Tennis Championship',
    description: 'Annual spring tournament for all skill levels',
    competition_type: 'tournament',
    sport: 'tennis',
    format: 'singles',
    competition_format: 'single_elimination',
    start_date: '2024-03-15T09:00:00Z',
    end_date: '2024-03-17T18:00:00Z',
    registration_deadline: '2024-03-10T23:59:59Z',
    club_id: 'club-123',
    max_participants: 32,
    min_skill_level: '3.0',
    max_skill_level: '5.0',
    bracket_data: null,
    is_active: true,
    created_by: 'user-456',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  club: {
    id: 'club-123',
    name: 'Riverside Tennis Club',
    description: 'Premier tennis facility',
    address: '123 River St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    postal_code: '10001',
    location_lat: 40.7128,
    location_lng: -74.006,
    phone: '555-0123',
    email: 'info@riverside.com',
    website: 'https://riverside.com',
    booking_url: null,
    logo_url: null,
    cover_image_url: null,
    is_claimed: true,
    claimed_by: 'user-789',
    sports: ['tennis'],
    amenities: ['Pro Shop', 'Locker Rooms'],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  spotsLeft: 8,
};

const golfTournament: FeedTournament = {
  ...sampleTournament,
  competition: {
    ...sampleTournament.competition,
    id: '2',
    name: 'City Golf Open',
    sport: 'golf',
    format: 'singles',
    competition_format: 'stroke_play' as any, // Golf uses different format
    start_date: '2024-04-05T08:00:00Z',
    end_date: '2024-04-05T17:00:00Z',
    max_participants: 64,
    min_skill_level: '10',
    max_skill_level: '25',
  },
  club: {
    ...sampleTournament.club,
    name: 'Lakeside Golf Course',
    sports: ['golf'],
  },
  spotsLeft: 15,
};

const padelTournament: FeedTournament = {
  ...sampleTournament,
  competition: {
    ...sampleTournament.competition,
    id: '3',
    name: 'Padel Masters',
    sport: 'padel',
    format: 'doubles',
    start_date: '2024-03-22T10:00:00Z',
    end_date: '2024-03-24T19:00:00Z',
    max_participants: 16,
    min_skill_level: '4.0',
    max_skill_level: null,
  },
  club: {
    ...sampleTournament.club,
    name: 'Downtown Padel Center',
    sports: ['padel'],
  },
  spotsLeft: 2,
};

const allLevelsTournament: FeedTournament = {
  ...sampleTournament,
  competition: {
    ...sampleTournament.competition,
    id: '4',
    name: 'Community Pickleball Fun Day',
    sport: 'pickleball',
    format: 'doubles',
    start_date: '2024-03-30T12:00:00Z',
    end_date: '2024-03-30T18:00:00Z',
    max_participants: 40,
    min_skill_level: null,
    max_skill_level: null,
  },
  club: {
    ...sampleTournament.club,
    name: 'Community Recreation Center',
    sports: ['pickleball'],
  },
  spotsLeft: 20,
};

export function TournamentCardExample() {
  const handleEnter = (tournamentName: string) => {
    console.log(`Enter clicked for: ${tournamentName}`);
  };

  return (
    <div style={{ padding: 20, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20 }}>TournamentCard Examples</h1>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Single Card</h2>
      <div style={{ maxWidth: 600 }}>
        <TournamentCard
          tournament={sampleTournament}
          onEnterClick={() => handleEnter(sampleTournament.competition.name)}
        />
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Multiple Cards (Vertical Stack)</h2>
      <div style={{ maxWidth: 600 }}>
        <TournamentCard
          tournament={sampleTournament}
          onEnterClick={() => handleEnter(sampleTournament.competition.name)}
        />
        <TournamentCard
          tournament={golfTournament}
          onEnterClick={() => handleEnter(golfTournament.competition.name)}
        />
        <TournamentCard
          tournament={padelTournament}
          onEnterClick={() => handleEnter(padelTournament.competition.name)}
        />
        <TournamentCard
          tournament={allLevelsTournament}
          onEnterClick={() => handleEnter(allLevelsTournament.competition.name)}
        />
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Different Sports</h2>
      <div style={{ maxWidth: 600 }}>
        <TournamentCard
          tournament={sampleTournament}
          onEnterClick={() => handleEnter(sampleTournament.competition.name)}
        />
        <TournamentCard
          tournament={golfTournament}
          onEnterClick={() => handleEnter(golfTournament.competition.name)}
        />
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Low Spots Available</h2>
      <div style={{ maxWidth: 600 }}>
        <TournamentCard
          tournament={padelTournament}
          onEnterClick={() => handleEnter(padelTournament.competition.name)}
        />
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>All Skill Levels</h2>
      <div style={{ maxWidth: 600 }}>
        <TournamentCard
          tournament={allLevelsTournament}
          onEnterClick={() => handleEnter(allLevelsTournament.competition.name)}
        />
      </div>
    </div>
  );
}

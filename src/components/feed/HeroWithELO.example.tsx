import { HeroCard } from './HeroCard';
import { ELOStrip } from './ELOStrip';
import type { Match, Profile, Club } from '@/types/database';

/**
 * Example showing HeroCard with ELOStrip attached below
 * Demonstrates the seamless connection between the two components
 */

// Mock data
const mockMatch: Match = {
  id: '1',
  sport: 'tennis',
  format: 'singles',
  club_id: 'club-1',
  ladder_id: null,
  competition_id: null,
  competition_fixture_id: null,
  scheduled_at: null,
  played_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  score: { team1: 6, team2: 4 },
  score_status: 'confirmed',
  score_submitted_by: 'user-1',
  score_confirmed_by: 'user-2',
  dispute_reason: null,
  winner_team: 1,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockOpponent: Profile = {
  id: 'user-2',
  email: 'sarah.johnson@example.com',
  full_name: 'Sarah Johnson',
  avatar_url: null,
  bio: 'Tennis enthusiast',
  phone: null,
  location_lat: 40.7128,
  location_lng: -74.006,
  location_city: 'New York',
  location_country: 'USA',
  home_club_id: 'club-1',
  onboarding_completed: true,
  dark_mode: false,
  push_notifications: true,
  email_notifications: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_seen: new Date().toISOString(),
};

const mockClub: Club = {
  id: 'club-1',
  name: 'Central Park Tennis Club',
  description: 'Premier tennis facility',
  address: '123 Park Ave',
  city: 'New York',
  state: 'NY',
  country: 'USA',
  postal_code: '10001',
  location_lat: 40.7829,
  location_lng: -73.9654,
  phone: '555-0123',
  email: 'info@cptc.com',
  website: 'https://cptc.com',
  booking_url: null,
  logo_url: null,
  cover_image_url: null,
  is_claimed: true,
  claimed_by: 'admin-1',
  sports: ['tennis', 'pickleball'],
  amenities: ['Pro Shop', 'Locker Rooms'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Sample sparkline data (last 10 matches)
const sparklineDataWin = [1180, 1195, 1188, 1205, 1198, 1210, 1205, 1218, 1212, 1226];
const sparklineDataLoss = [1220, 1215, 1225, 1218, 1230, 1225, 1220, 1215, 1208, 1200];

export function HeroWithELOExample() {
  return (
    <div style={{ padding: 20, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20, fontFamily: 'var(--font-body)' }}>
        HeroCard + ELOStrip Combined
      </h1>

      {/* Example 1: Win with positive ELO */}
      <div style={{ marginBottom: 40, maxWidth: 400 }}>
        <h2 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-t2)' }}>
          Win (+14 ELO)
        </h2>
        <div>
          <HeroCard
            match={mockMatch}
            opponent={mockOpponent}
            club={mockClub}
            eloChange={14}
            onShareClick={() => console.log('Share')}
            onOptionsClick={() => console.log('Options')}
          />
          <ELOStrip
            eloChange={14}
            currentElo={1226}
            sparklineData={sparklineDataWin}
          />
        </div>
      </div>

      {/* Example 2: Loss with negative ELO */}
      <div style={{ marginBottom: 40, maxWidth: 400 }}>
        <h2 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-t2)' }}>
          Loss (-12 ELO)
        </h2>
        <div>
          <HeroCard
            match={{
              ...mockMatch,
              score: { team1: 4, team2: 6 },
              winner_team: 2,
            }}
            opponent={mockOpponent}
            club={mockClub}
            eloChange={-12}
            onShareClick={() => console.log('Share')}
            onOptionsClick={() => console.log('Options')}
          />
          <ELOStrip
            eloChange={-12}
            currentElo={1200}
            sparklineData={sparklineDataLoss}
          />
        </div>
      </div>

      {/* Example 3: No sparkline data */}
      <div style={{ marginBottom: 40, maxWidth: 400 }}>
        <h2 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-t2)' }}>
          First Match (No History)
        </h2>
        <div>
          <HeroCard
            match={mockMatch}
            opponent={mockOpponent}
            club={mockClub}
            eloChange={14}
            onShareClick={() => console.log('Share')}
            onOptionsClick={() => console.log('Options')}
          />
          <ELOStrip
            eloChange={14}
            currentElo={1214}
            sparklineData={[]}
          />
        </div>
      </div>
    </div>
  );
}

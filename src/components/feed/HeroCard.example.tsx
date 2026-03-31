import { HeroCard } from './HeroCard';
import type { Match, Profile, Club } from '@/types/database';

/**
 * Example usage of the HeroCard component
 * 
 * This component displays the user's latest match result prominently
 * with a dark background, radial green glow, and detailed match information.
 */

// Mock data for demonstration
const mockMatch: Match = {
  id: '1',
  sport: 'tennis',
  format: 'singles',
  club_id: 'club-1',
  ladder_id: null,
  competition_id: null,
  competition_fixture_id: null,
  scheduled_at: null,
  played_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
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
  description: 'Premier tennis facility in Manhattan',
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
  amenities: ['Pro Shop', 'Locker Rooms', 'Cafe'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function HeroCardExample() {
  const handleShareClick = () => {
    console.log('Share button clicked');
    // In real implementation, this would open a share dialog
  };

  const handleOptionsClick = () => {
    console.log('Options button clicked');
    // In real implementation, this would open an options menu
  };

  return (
    <div style={{ padding: 20, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20, fontFamily: 'var(--font-body)' }}>
        HeroCard Component Example
      </h1>

      {/* Example 1: Win scenario with positive ELO change */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-t2)' }}>
          Win Scenario (+14 ELO)
        </h2>
        <HeroCard
          match={mockMatch}
          opponent={mockOpponent}
          club={mockClub}
          eloChange={14}
          onShareClick={handleShareClick}
          onOptionsClick={handleOptionsClick}
        />
      </div>

      {/* Example 2: Loss scenario with negative ELO change */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-t2)' }}>
          Loss Scenario (-12 ELO)
        </h2>
        <HeroCard
          match={{
            ...mockMatch,
            score: { team1: 4, team2: 6 },
            winner_team: 2,
          }}
          opponent={mockOpponent}
          club={mockClub}
          eloChange={-12}
          onShareClick={handleShareClick}
          onOptionsClick={handleOptionsClick}
        />
      </div>

      {/* Example 3: Match without club information */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 12, fontSize: 14, color: 'var(--color-t2)' }}>
          Without Club Information
        </h2>
        <HeroCard
          match={mockMatch}
          opponent={mockOpponent}
          club={null}
          eloChange={14}
          onShareClick={handleShareClick}
          onOptionsClick={handleOptionsClick}
        />
      </div>
    </div>
  );
}

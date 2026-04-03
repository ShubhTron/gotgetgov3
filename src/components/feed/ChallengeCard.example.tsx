/**
 * ChallengeCard Example
 * Demonstrates the ChallengeCard component with sample data
 */

import { ChallengeCard } from './ChallengeCard';
import type { FeedChallenge } from '@/types/feed';

// Sample challenge data
const sampleChallenge: FeedChallenge = {
  challenge: {
    id: '1',
    sport: 'tennis',
    format: 'singles',
    status: 'proposed',
    score_status: null,
    proposed_by: 'user-123',
    proposed_times: null,
    confirmed_time: '2024-01-20T14:00:00Z',
    club_id: 'club-456',
    ladder_id: null,
    court_name: null,
    location: 'Central Park Tennis Club',
    message: 'Looking forward to playing!',
    match_id: null,
    expires_at: null,
    is_open: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date().toISOString(),
  },
  challenger: {
    id: 'user-123',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    avatar_url: null,
    bio: 'Tennis enthusiast',
    phone: null,
    location_lat: 40.7128,
    location_lng: -74.006,
    location_city: 'New York',
    location_country: 'USA',
    home_club_id: 'club-456',
    onboarding_completed: true,
    dark_mode: false,
    push_notifications: true,
    email_notifications: true,
    last_seen: new Date().toISOString(),
    created_at: '2023-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
  },
  players: [],
  isNew: true,
  distance: 5,
};

const oldChallenge: FeedChallenge = {
  ...sampleChallenge,
  challenge: {
    ...sampleChallenge.challenge,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
  },
  challenger: {
    ...sampleChallenge.challenger,
    full_name: 'Sarah Johnson',
  },
  isNew: false,
  distance: 12,
};

export function ChallengeCardExample() {
  const handleRespond = () => {
    console.log('Respond clicked');
  };

  return (
    <div style={{ padding: 20, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20 }}>ChallengeCard Examples</h1>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>New Challenge</h2>
      <ChallengeCard challenge={sampleChallenge} onRespondClick={handleRespond} />

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Older Challenge (No "New" Badge)</h2>
      <ChallengeCard challenge={oldChallenge} onRespondClick={handleRespond} />

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Multiple Challenges</h2>
      <ChallengeCard challenge={sampleChallenge} onRespondClick={handleRespond} />
      <ChallengeCard challenge={oldChallenge} onRespondClick={handleRespond} />
      <ChallengeCard
        challenge={{
          ...sampleChallenge,
          challenger: { ...sampleChallenge.challenger, full_name: 'Mike Wilson' },
          isNew: false,
          distance: 8,
        }}
        onRespondClick={handleRespond}
      />
    </div>
  );
}

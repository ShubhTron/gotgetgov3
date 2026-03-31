/**
 * OpenMatchCard Example
 * Demonstrates the OpenMatchCard component with sample data
 */

import { OpenMatchCard } from './OpenMatchCard';
import type { FeedOpenMatch } from '@/types/feed';

// Sample open match data
const sampleOpenMatch: FeedOpenMatch = {
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
    message: 'Open match - anyone can join!',
    match_id: null,
    expires_at: null,
    is_open: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date().toISOString(),
  },
  host: {
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
  distance: 5,
};

const golfMatch: FeedOpenMatch = {
  ...sampleOpenMatch,
  challenge: {
    ...sampleOpenMatch.challenge,
    sport: 'golf',
    confirmed_time: '2024-01-21T09:00:00Z',
    location: 'Riverside Golf Club',
  },
  host: {
    ...sampleOpenMatch.host,
    full_name: 'Sarah Johnson',
  },
  distance: 12,
};

const pickleballMatch: FeedOpenMatch = {
  ...sampleOpenMatch,
  challenge: {
    ...sampleOpenMatch.challenge,
    sport: 'pickleball',
    confirmed_time: '2024-01-20T18:30:00Z',
    location: 'Downtown Pickleball Center',
  },
  host: {
    ...sampleOpenMatch.host,
    full_name: 'Mike Wilson',
  },
  distance: 3,
};

export function OpenMatchCardExample() {
  const handleJoin = () => {
    console.log('Join clicked');
  };

  return (
    <div style={{ padding: 20, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 20 }}>OpenMatchCard Examples</h1>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Single Card</h2>
      <div style={{ display: 'inline-block' }}>
        <OpenMatchCard openMatch={sampleOpenMatch} onJoinClick={handleJoin} />
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Horizontal Scroll (Multiple Cards)</h2>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 10,
          scrollbarWidth: 'none',
        }}
      >
        <OpenMatchCard openMatch={sampleOpenMatch} onJoinClick={handleJoin} />
        <OpenMatchCard openMatch={golfMatch} onJoinClick={handleJoin} />
        <OpenMatchCard openMatch={pickleballMatch} onJoinClick={handleJoin} />
        <OpenMatchCard openMatch={sampleOpenMatch} onJoinClick={handleJoin} />
        <OpenMatchCard openMatch={golfMatch} onJoinClick={handleJoin} />
      </div>

      <h2 style={{ marginTop: 30, marginBottom: 10 }}>Different Sports</h2>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <OpenMatchCard openMatch={sampleOpenMatch} onJoinClick={handleJoin} />
        <OpenMatchCard openMatch={golfMatch} onJoinClick={handleJoin} />
        <OpenMatchCard openMatch={pickleballMatch} onJoinClick={handleJoin} />
      </div>
    </div>
  );
}

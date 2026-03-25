/**
 * Mock Data for the application.
 *
 * ALL mock/sample data is centralized here. To remove all mock data
 * from the application, simply empty every array below (set to []).
 * The app will then only show real data from Supabase.
 */

// ─── News Feed ──────────────────────────────────────────────────────
export const sampleFeed = [
  {
    id: '1',
    type: 'match_result',
    imageUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
    author: { id: '1', name: 'Fox Meadow TC', avatarUrl: 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg?auto=compress&cs=tinysrgb&w=400' },
    audienceLabel: 'Fox Meadow Tennis Club',
    metadata: { winner: 'Alex Thompson', loser: 'Jordan Rivera', score: '6-4, 7-5' },
    reactions: { like: 12, celebrate: 5, fire: 3 },
    comments: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    category: 'club',
  },
  {
    id: '2',
    type: 'ladder_movement',
    imageUrl: 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=800',
    author: { id: '2', name: 'Platform Tennis Ladder', avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400' },
    audienceLabel: 'Spring Singles Ladder',
    metadata: { winner: 'Sam Chen', positionChange: 2 },
    reactions: { like: 8, celebrate: 12, fire: 2 },
    comments: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    category: 'competitions',
  },
  {
    id: '3',
    type: 'announcement',
    imageUrl: 'https://images.pexels.com/photos/209841/pexels-photo-209841.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Court 3 closed for maintenance',
    content: 'Court 3 will be closed from March 15-17 for resurfacing. Please book courts 1, 2, or 4 during this time.',
    author: { id: '3', name: 'Club Admin', avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' },
    audienceLabel: 'Fox Meadow Tennis Club',
    reactions: { like: 3, celebrate: 0, fire: 0 },
    comments: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    category: 'club',
  },
  {
    id: '4',
    type: 'event',
    imageUrl: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800',
    author: { id: '4', name: 'Morgan Lee', avatarUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400' },
    audienceLabel: 'Weekend Doubles Group',
    metadata: { eventName: 'Saturday Morning Round Robin', eventId: 'e1000001-0000-0000-0000-000000000001', eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
    content: 'Join us for our weekly round robin! 4 spots left. Intermediate+ level.',
    reactions: { like: 6, celebrate: 4, fire: 1 },
    comments: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    category: 'circles',
  },
  {
    id: '7',
    type: 'event',
    imageUrl: 'https://images.pexels.com/photos/2932338/pexels-photo-2932338.jpeg?auto=compress&cs=tinysrgb&w=800',
    author: { id: '4', name: 'Club Admin', avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' },
    audienceLabel: 'Fox Meadow Tennis Club',
    metadata: { eventName: 'Tuesday Night Doubles', eventId: 'e1000001-0000-0000-0000-000000000002', eventDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString() },
    content: 'Competitive doubles play every Tuesday. Sign up now!',
    reactions: { like: 8, celebrate: 2, fire: 3 },
    comments: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    category: 'club',
  },
  {
    id: '5',
    type: 'achievement',
    imageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800',
    author: { id: '5', name: 'Taylor Williams', avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400' },
    metadata: { achievement: '10 Match Streak' },
    reactions: { like: 24, celebrate: 18, fire: 12 },
    comments: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    category: 'circles',
  },
  {
    id: '6',
    type: 'connection_accepted',
    imageUrl: 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg?auto=compress&cs=tinysrgb&w=800',
    author: { id: '6', name: 'Alex Thompson', avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400' },
    metadata: {
      connectedUser: { id: '7', name: 'Jordan Rivera', avatarUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400' },
    },
    reactions: { like: 5, celebrate: 8, fire: 1 },
    comments: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    category: 'circles',
  },
];

// ─── Results Page: Match History ────────────────────────────────────
export const sampleMatches = [
  { id: '1', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), sport: 'platform_tennis', opponent: { name: 'Alex Thompson', avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400' }, score: '6-4, 7-5', won: true },
  { id: '2', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), sport: 'tennis', opponent: { name: 'Jordan Rivera', avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }, score: '4-6, 6-7', won: false },
  { id: '3', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), sport: 'pickleball', opponent: { name: 'Sam Chen', avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400' }, score: '11-8, 11-6', won: true, competitionName: 'Spring Ladder' },
  { id: '4', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), sport: 'padel', opponent: { name: 'Taylor Williams', avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400' }, score: '6-3, 3-6, 7-6', won: true },
];

// ─── Results Page: Ladder Standings ─────────────────────────────────
export const sampleLadderStandings = [
  { id: '1', position: 1, previousPosition: 1, player: { name: 'Morgan Lee', avatarUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400' }, matchesPlayed: 12, matchesWon: 10, ladderName: 'Platform Tennis Singles' },
  { id: '2', position: 2, previousPosition: 4, player: { name: 'Alex Thompson', avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400' }, matchesPlayed: 10, matchesWon: 8, ladderName: 'Platform Tennis Singles' },
  { id: '3', position: 3, previousPosition: 2, player: { name: 'Jordan Rivera', avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400' }, matchesPlayed: 11, matchesWon: 7, ladderName: 'Platform Tennis Singles' },
  { id: '4', position: 4, previousPosition: 3, player: { name: 'Sam Chen', avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400' }, matchesPlayed: 9, matchesWon: 6, ladderName: 'Platform Tennis Singles' },
  { id: '5', position: 5, previousPosition: 5, player: { name: 'Me' }, matchesPlayed: 8, matchesWon: 5, ladderName: 'Platform Tennis Singles' },
];

// ─── Results Page: League Standings ─────────────────────────────────
export const sampleLeagueStandings = [
  { position: 1, team: 'Team Alpha', played: 5, won: 4, drawn: 1, lost: 0, points: 13 },
  { position: 2, team: 'Team Beta', played: 5, won: 3, drawn: 1, lost: 1, points: 10 },
  { position: 3, team: 'Team Gamma', played: 5, won: 2, drawn: 2, lost: 1, points: 8 },
  { position: 4, team: 'Team Delta', played: 5, won: 1, drawn: 1, lost: 3, points: 4 },
];

// ─── Results Page: Tournament Results ───────────────────────────────
export const sampleTournaments = [
  { id: 'tourney-1', name: 'Spring Championship', status: 'Completed', format: 'Single Elimination - 16 Players - Tennis', winner: 'Morgan Lee' },
  { id: 'tourney-2', name: 'Club Doubles Classic', status: 'In Progress', format: 'Double Elimination - 8 Teams - Platform Tennis', nextRound: 'Semifinals - March 20' },
];

// ─── Schedule Page ──────────────────────────────────────────────────
export const sampleSchedule = [
  {
    id: 'sample-1',
    type: 'match' as const,
    title: 'Singles Match',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24),
    time: '6:00 PM',
    location: 'Court 2, Fox Meadow TC',
    opponent: { name: 'Alex Thompson' },
    status: 'confirmed' as const,
    category: 'my' as const,
  },
  {
    id: 'sample-3',
    type: 'coaching' as const,
    title: 'Coaching Session with Mike Johnson',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    time: '10:00 AM',
    location: 'Court 1, Westchester CC',
    status: 'confirmed' as const,
    category: 'my' as const,
  },
  {
    id: 'sample-4',
    type: 'fixture' as const,
    title: 'League Match - Round 3',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
    time: '7:00 PM',
    location: 'TBD',
    opponent: { name: 'Jordan Rivera' },
    status: 'tentative' as const,
    category: 'my' as const,
  },
  {
    id: 'sample-5',
    type: 'match' as const,
    title: 'Ladder Match',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    time: 'Pending',
    opponent: { name: 'Sam Chen' },
    status: 'pending' as const,
    category: 'my' as const,
  },
];

// ─── Circles Page: Match Requests ───────────────────────────────────
export const sampleMatchRequests = [
  { id: '1', opponent: { name: 'Morgan Lee', avatarUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400' }, sport: 'Platform Tennis', proposedTimes: ['Sat 10am', 'Sun 2pm'], status: 'pending' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), ladderName: 'Spring Ladder' },
  { id: '2', opponent: { name: 'Taylor Williams', avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400' }, sport: 'Padel', proposedTimes: ['Fri 6pm'], status: 'accepted' as const, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

// ─── Discover Page: Fallback Competitions ───────────────────────────
export const fallbackCompetitions = [
  { id: 'comp-1', name: 'Spring Singles Ladder', type: 'Ladder', sport: 'Platform Tennis', participants: 24, status: 'active', startDate: 'Mar 1', location: 'Fox Meadow TC' },
  { id: 'comp-2', name: 'Weekend Warriors League', type: 'League', sport: 'Tennis', participants: 16, status: 'registration_open', startDate: 'Apr 1', location: 'Westchester CC' },
  { id: 'comp-3', name: 'Club Championship', type: 'Tournament', sport: 'Pickleball', participants: 32, status: 'coming_soon', startDate: 'May 15', location: 'Sleepy Hollow CC' },
];

// ─── Discover Page: Fallback Events ─────────────────────────────────
export const fallbackEvents = [
  { id: 'event-1', name: 'Friday Open Play', date: 'Fri, Mar 15', time: '6:00 PM', club: 'Fox Meadow TC', spots: '4/8', sport: 'Platform Tennis' },
  { id: 'event-2', name: 'Beginner Clinic', date: 'Sat, Mar 16', time: '10:00 AM', club: 'Westchester CC', spots: '6/12', sport: 'Tennis' },
  { id: 'event-3', name: 'Doubles Round Robin', date: 'Sun, Mar 17', time: '2:00 PM', club: 'Sleepy Hollow CC', spots: '8/16', sport: 'Pickleball' },
];

// ─── Results Page: Stats Overview ───────────────────────────────────
export const sampleStats = {
  matchesPlayed: 12,
  wins: 8,
  winRate: '67%',
};

// ─── Stories: Sample Players Who Have Stories ────────────────────────
// These are the "connection" players who have active stories (mock data).
// The IDs here are used as keys in sampleStoriesByPlayer below.
export const sampleStoryPlayers = [
  {
    id: 'story-player-1',
    fullName: 'Vaibhav Sharma',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    isConnection: true,
  },
  {
    id: 'story-player-2',
    fullName: 'Shubhsha Mehta',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    isConnection: true,
  },
  {
    id: 'story-player-3',
    fullName: 'Alex Thompson',
    avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    isConnection: false,
  },
  {
    id: 'story-player-4',
    fullName: 'Morgan Lee',
    avatarUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400',
    isConnection: false,
  },
  {
    id: 'story-player-5',
    fullName: 'Jordan Rivera',
    avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    isConnection: true,
  },
];

// ─── Stories: Sample Stories By Player ──────────────────────────────
export const sampleStoriesByPlayer: Record<string, Array<{
  id: string;
  type: 'image' | 'match_result' | 'text';
  content: string;
  timestamp: string;
  meta?: any;
}>> = {
  'story-player-1': [
    {
      id: 'story-1a',
      type: 'image',
      content: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
      timestamp: '2h ago',
    },
  ],
  'story-player-2': [
    {
      id: 'story-2a',
      type: 'match_result',
      content: 'match_result',
      timestamp: '5h ago',
      meta: { result: 'win', opponent: 'Alex T.', score: '6-4, 7-5' },
    },
    {
      id: 'story-2b',
      type: 'image',
      content: 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=800',
      timestamp: '5h ago',
    },
  ],
  'story-player-3': [
    {
      id: 'story-3a',
      type: 'text',
      content: '🎾 What a session today! Ready for the club finals.',
      timestamp: '1h ago',
    },
  ],
  'story-player-4': [
    {
      id: 'story-4a',
      type: 'image',
      content: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800',
      timestamp: '3h ago',
    },
  ],
  'story-player-5': [
    {
      id: 'story-5a',
      type: 'match_result',
      content: 'match_result',
      timestamp: '7h ago',
      meta: { result: 'loss', opponent: 'Morgan L.', score: '3-6, 5-7' },
    },
  ],
};

// ─── Discovery Mode: Profile Details ────────────────────────────────
export interface ProfilePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  uploadedAt: Date;
}

export interface ProfileDetails {
  userId: string;
  bio: string;
  interests: string[];
  genderPreference?: string;
  occupation?: string;
  education?: string;
  pets?: string;
  hobbies?: string[];
  drinkingPreference: string;
  smokingPreference: string;
  archivePhotos: ProfilePhoto[];
}

export const sampleProfileDetails: Record<string, ProfileDetails> = {
  'profile-1': {
    userId: 'profile-1',
    bio: 'Tennis enthusiast and weekend warrior. Love playing doubles and meeting new people on the court. Always up for a friendly match!',
    interests: ['Tennis', 'Fitness', 'Travel', 'Photography'],
    genderPreference: 'Women',
    occupation: 'Software Engineer',
    education: 'Stanford University',
    pets: 'Dog lover 🐕',
    hobbies: ['Hiking', 'Cooking', 'Reading'],
    drinkingPreference: 'Socially',
    smokingPreference: 'Never',
    archivePhotos: [
      {
        id: 'photo-1-1',
        url: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      },
      {
        id: 'photo-1-2',
        url: 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      },
      {
        id: 'photo-1-3',
        url: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
      },
      {
        id: 'photo-1-4',
        url: 'https://images.pexels.com/photos/209841/pexels-photo-209841.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/209841/pexels-photo-209841.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
      },
      {
        id: 'photo-1-5',
        url: 'https://images.pexels.com/photos/2932338/pexels-photo-2932338.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/2932338/pexels-photo-2932338.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
      },
      {
        id: 'photo-1-6',
        url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 42),
      },
    ],
  },
  'profile-2': {
    userId: 'profile-2',
    bio: 'Platform tennis player looking to improve my game. Member at Fox Meadow TC. Let\'s hit!',
    interests: ['Platform Tennis', 'Padel', 'Yoga'],
    genderPreference: 'Everyone',
    occupation: 'Marketing Manager',
    education: 'NYU',
    pets: 'Cat person 🐈',
    hobbies: ['Yoga', 'Wine tasting', 'Art galleries'],
    drinkingPreference: 'Regularly',
    smokingPreference: 'Never',
    archivePhotos: [
      {
        id: 'photo-2-1',
        url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      },
      {
        id: 'photo-2-2',
        url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
      },
      {
        id: 'photo-2-3',
        url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19),
      },
    ],
  },
  'profile-3': {
    userId: 'profile-3',
    bio: 'Competitive player seeking practice partners for upcoming tournaments. NTRP 4.5. Available weekday mornings and weekends.',
    interests: ['Tennis', 'Pickleball', 'Running', 'Nutrition'],
    occupation: 'Physical Therapist',
    education: 'Columbia University',
    pets: 'No pets',
    hobbies: ['Running', 'Meditation', 'Podcasts'],
    drinkingPreference: 'Never',
    smokingPreference: 'Never',
    archivePhotos: [
      {
        id: 'photo-3-1',
        url: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
      {
        id: 'photo-3-2',
        url: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      },
      {
        id: 'photo-3-3',
        url: 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 17),
      },
      {
        id: 'photo-3-4',
        url: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 24),
      },
    ],
  },
  'profile-4': {
    userId: 'profile-4',
    bio: 'Just getting back into tennis after a long break. Looking for patient partners who don\'t mind rallying and working on fundamentals. Beginner/intermediate level.',
    interests: ['Tennis', 'Music', 'Movies'],
    genderPreference: 'Men',
    occupation: 'Teacher',
    education: 'Boston College',
    hobbies: ['Guitar', 'Concerts', 'Board games'],
    drinkingPreference: 'Socially',
    smokingPreference: 'Occasionally',
    archivePhotos: [
      {
        id: 'photo-4-1',
        url: 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
      },
      {
        id: 'photo-4-2',
        url: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800',
        thumbnailUrl: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=300',
        width: 800,
        height: 800,
        uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
      },
    ],
  },
  'profile-5': {
    userId: 'profile-5',
    bio: '',
    interests: ['Padel', 'Beach volleyball'],
    drinkingPreference: 'Not specified',
    smokingPreference: 'Not specified',
    archivePhotos: [],
  },
};

// ─── Discovery Mode: Discover Players (Card Stack) ──────────────────
export interface DiscoverPlayer {
  id: string;
  fullName: string;
  age: number;
  location: string;
  distance: string;
  sport: string;
  skillLevel: string;
  avatarUrl: string;
  profileImageUrl: string;
  availability: string;
  matchPercentage?: number;
}

export const sampleDiscoverPlayers: DiscoverPlayer[] = [
  {
    id: 'profile-1',
    fullName: 'Sarah Johnson',
    age: 28,
    location: 'Westchester, NY',
    distance: '2.3 miles away',
    sport: 'Tennis',
    skillLevel: 'Intermediate',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    profileImageUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800',
    availability: 'Weekends',
    matchPercentage: 92,
  },
  {
    id: 'profile-2',
    fullName: 'Michael Chen',
    age: 32,
    location: 'Scarsdale, NY',
    distance: '3.7 miles away',
    sport: 'Platform Tennis',
    skillLevel: 'Advanced',
    avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    profileImageUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=800',
    availability: 'Weekday mornings',
    matchPercentage: 88,
  },
  {
    id: 'profile-3',
    fullName: 'Emily Rodriguez',
    age: 26,
    location: 'White Plains, NY',
    distance: '4.1 miles away',
    sport: 'Tennis',
    skillLevel: 'Advanced',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    profileImageUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800',
    availability: 'Flexible',
    matchPercentage: 95,
  },
  {
    id: 'profile-4',
    fullName: 'David Kim',
    age: 35,
    location: 'Rye, NY',
    distance: '5.2 miles away',
    sport: 'Pickleball',
    skillLevel: 'Beginner',
    avatarUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400',
    profileImageUrl: 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800',
    availability: 'Evenings',
    matchPercentage: 78,
  },
  {
    id: 'profile-5',
    fullName: 'Jessica Martinez',
    age: 29,
    location: 'Mamaroneck, NY',
    distance: '6.8 miles away',
    sport: 'Padel',
    skillLevel: 'Intermediate',
    avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    profileImageUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800',
    availability: 'Weekends',
    matchPercentage: 85,
  },
];

// ─── Discovery Mode: Analytics Events ───────────────────────────────
export interface DiscoveryModeAnalyticsEvent {
  id: string;
  eventType: 'discovery_mode_activation' | 'discovery_mode_exit' | 'profile_details_scroll' | 'discovery_mode_interaction' | 'discovery_mode_error';
  userId: string;
  profileId: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

export const sampleDiscoveryModeAnalytics: DiscoveryModeAnalyticsEvent[] = [
  {
    id: 'analytics-1',
    eventType: 'discovery_mode_activation',
    userId: 'current-user',
    profileId: 'profile-1',
    metadata: {
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      scrollPosition: 450,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 'analytics-2',
    eventType: 'profile_details_scroll',
    userId: 'current-user',
    profileId: 'profile-1',
    metadata: {
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      scrollDepth: 50,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 4),
  },
  {
    id: 'analytics-3',
    eventType: 'discovery_mode_interaction',
    userId: 'current-user',
    profileId: 'profile-1',
    metadata: {
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      action: 'like',
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
  },
  {
    id: 'analytics-4',
    eventType: 'discovery_mode_exit',
    userId: 'current-user',
    profileId: 'profile-1',
    metadata: {
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      duration: 120000,
      scrollDepth: 75,
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
  },
];

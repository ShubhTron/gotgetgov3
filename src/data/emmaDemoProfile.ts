import type { Profile, Conversation, ConversationParticipant, Message } from '../types/database';
import type { DiscoverPlayer } from '../types/discover';
import type { ConversationItem, MessageWithSender, ParticipantWithProfile } from '../types/circles';

// ─── IDs ──────────────────────────────────────────────────────────────────────

export const EMMA_USER_ID = 'demo-emma-user';
export const EMMA_CONV_ID = 'demo-emma-chat';

// ─── DiscoverPlayer (SwipeDeck shape) ─────────────────────────────────────────

export const EMMA_DISCOVER_PLAYER: DiscoverPlayer = {
  id: EMMA_USER_ID,
  fullName: 'Emma Rodriguez',
  avatarUrl: undefined,
  sport: 'tennis',
  sportName: 'Tennis',
  level: 'intermediate',
  levelLabel: 'Intermediate',
  distanceKm: 1.2,
  isActiveRecently: true,
  availability: 'flexible',
  preferredTime: 'flexible',
  homeClub: 'Demo City TC',
  scheduleOverlapLabel: '2h overlap',
  playStyle: 'all-round',
  compatibilityScore: 94,
  recentMatches: [],
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const EMMA_PROFILE: Profile = {
  id: EMMA_USER_ID,
  email: '',
  full_name: 'Emma Rodriguez',
  avatar_url: null,
  bio: 'Love playing tennis on weekends! Looking for hitting partners.',
  phone: null,
  location_lat: null,
  location_lng: null,
  location_city: 'Demo City',
  location_country: null,
  home_club_id: null,
  onboarding_completed: true,
  dark_mode: false,
  push_notifications: false,
  email_notifications: false,
  last_seen: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ─── Conversation ─────────────────────────────────────────────────────────────

const EMMA_RAW_CONVERSATION: Conversation = {
  id: EMMA_CONV_ID,
  type: 'direct',
  circle_id: null,
  team_id: null,
  name: null,
  avatar_url: null,
  created_by: EMMA_USER_ID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const EMMA_PARTICIPANT: ConversationParticipant = {
  id: 'demo-emma-participant',
  conversation_id: EMMA_CONV_ID,
  user_id: EMMA_USER_ID,
  last_read_at: null,
  joined_at: new Date().toISOString(),
  is_admin: false,
  is_creator: false,
};

const EMMA_PARTICIPANT_WITH_PROFILE: ParticipantWithProfile = {
  participant: EMMA_PARTICIPANT,
  profile: EMMA_PROFILE,
};

export const EMMA_CONVERSATION_ITEM: ConversationItem = {
  conversation: EMMA_RAW_CONVERSATION,
  otherParticipants: [EMMA_PARTICIPANT_WITH_PROFILE],
  myParticipant: {
    id: 'demo-my-participant',
    conversation_id: EMMA_CONV_ID,
    user_id: 'guest',
    last_read_at: null,
    joined_at: new Date().toISOString(),
    is_admin: false,
    is_creator: false,
  },
  lastMessage: null,
  unreadCount: 1,
  displayName: 'Emma Rodriguez',
  displayAvatarUrl: null,
  isOnline: true,
  lastActivity: new Date().toISOString(),
};

// ─── Scripted messages ────────────────────────────────────────────────────────

export const EMMA_GREETING_TEXT = "Hey! 👋 When are you free to play?";
export const EMMA_REPLY_TEXT = "Perfect! See you at the match! 🎾";

export function makeEmmaMessage(content: string): Message {
  return {
    id: `demo-emma-msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    conversation_id: EMMA_CONV_ID,
    sender_id: EMMA_USER_ID,
    content,
    encrypted_content: null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  };
}

export function makeEmmaMessageWithSender(content: string): MessageWithSender {
  return {
    message: makeEmmaMessage(content),
    sender: EMMA_PROFILE,
    isMine: false,
  };
}

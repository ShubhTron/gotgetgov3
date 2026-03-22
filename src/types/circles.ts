import type {
  Conversation,
  ConversationParticipant,
  Message,
  Profile,
} from './database';

// ─── Participant enriched with their profile ─────────────────────────────────

export interface ParticipantWithProfile {
  participant: ConversationParticipant;
  profile: Profile;
}

// ─── Conversation enriched for list display ───────────────────────────────────

export interface ConversationItem {
  conversation: Conversation;
  otherParticipants: ParticipantWithProfile[];
  myParticipant: ConversationParticipant;
  lastMessage: Message | null;
  unreadCount: number;
  /** Other user's name for DM; conversation.name for group/circle */
  displayName: string;
  /** Other user's avatar_url for DM; conversation.avatar_url for group */
  displayAvatarUrl: string | null;
  /** true if the other user's last_seen is within the last 5 minutes */
  isOnline: boolean;
  /** ISO timestamp of the latest activity (last message or conversation updated_at) */
  lastActivity: string;
}

// ─── Message enriched with sender profile ─────────────────────────────────────

export interface MessageWithSender {
  message: Message;
  sender: Profile;
  isMine: boolean;
}

// ─── Navigation state machine ─────────────────────────────────────────────────

export type CirclesScreen =
  | { view: 'list' }
  | { view: 'chat'; item: ConversationItem };

// ─── Sport card embedded in a message ─────────────────────────────────────────

/** Stored in message.content as: __SPORT_CARD__:{json} */
export interface SportCardPayload {
  goal: string;       // e.g. "TRAINING GOAL"
  sport: string;      // e.g. "tennis"
  title: string;      // e.g. "Precision Drills"
  description: string;
  participantIds: string[];
}

// ─── Stories strip item ───────────────────────────────────────────────────────

export interface StoryItem {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  /** Has at least one non-expired story row */
  hasActiveStory: boolean;
  isCurrentUser: boolean;
  /** last_seen within 5 minutes */
  isOnline: boolean;
}

// ─── Prefix constant for sport card messages ──────────────────────────────────

export const SPORT_CARD_PREFIX = '__SPORT_CARD__:';

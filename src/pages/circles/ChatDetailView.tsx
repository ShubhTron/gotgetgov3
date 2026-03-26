import React, { useState, useEffect, useRef } from 'react';
import {
  Avatar,
  IconArrowLeft,
} from '../../design-system';
import { ChatBubble } from '../../components/circles/ChatBubble';
import { MessageComposer } from '../../components/circles/MessageComposer';
import { ScheduleOverlapBar } from '../../components/circles/ScheduleOverlapBar';
import { SuggestTimeSheet } from '../../components/circles/SuggestTimeSheet';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import type { ConversationItem, MessageWithSender, MatchProposalPayload } from '../../types/circles';
import { MATCH_PROPOSAL_PREFIX } from '../../types/circles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOnlineNow(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return '';
  const diffMin = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60_000);
  if (diffMin < 1) return 'Active now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Active ${diffH}h ago`;
  return `Active ${Math.floor(diffH / 24)}d ago`;
}

/** Format a date for the day-separator chip */
function formatDaySeparator(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) {
    return `Today, ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }
  if (sameDay(date, yesterday)) {
    return `Yesterday, ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/** Returns true if two ISO timestamps belong to different calendar days */
function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatDetailViewProps {
  conversationItem: ConversationItem;
  onBack: () => void;
  markAsRead: (conversationId: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatDetailView({ conversationItem, onBack, markAsRead }: ChatDetailViewProps) {
  const { messages, loading, error, sendMessage, sending } = useMessages(
    conversationItem.conversation.id
  );
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const otherProfile = conversationItem.otherParticipants[0]?.profile ?? null;
  const otherUserId = otherProfile?.id ?? '';
  const online = otherProfile ? isOnlineNow(otherProfile.last_seen) : false;

  // Mark messages as read when entering the chat
  useEffect(() => {
    markAsRead(conversationItem.conversation.id);
  }, [conversationItem.conversation.id, markAsRead]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Also mark as read when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead(conversationItem.conversation.id);
    }
  }, [messages.length, conversationItem.conversation.id, markAsRead]);

  // ── Proposal handlers ────────────────────────────────────────────────────
  function handleSendProposal(payload: Omit<MatchProposalPayload, 'status' | 'proposedBy'>) {
    const full: MatchProposalPayload = {
      ...payload,
      status: 'pending',
      proposedBy: user?.id ?? '',
    };
    sendMessage(MATCH_PROPOSAL_PREFIX + JSON.stringify(full));
  }

  function handleAcceptProposal(_messageId: string) {
    sendMessage('✅ Accepted the match proposal!');
  }

  function handleAltProposal(_messageId: string) {
    setSuggestOpen(true);
  }

  function handleDeclineProposal(_messageId: string) {
    sendMessage("Thanks, but that time doesn't work for me.");
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
      }}
    >
      {/* ── Chat Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 12px 12px 8px',
          gap: 10,
          background: 'var(--color-surf)',
          flexShrink: 0,
          // Tonal bottom shadow — no border
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-t1)',
            flexShrink: 0,
          }}
        >
          <IconArrowLeft size={22} />
        </button>

        {/* Avatar + name + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              name={conversationItem.displayName}
              imageUrl={conversationItem.displayAvatarUrl ?? undefined}
              size="md"
            />
            {online && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: 1,
                  width: 10,
                  height: 10,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-acc)',
                  border: '2px solid var(--color-surf)',
                }}
              />
            )}
          </div>

          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--color-t1)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {conversationItem.displayName}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: online ? 'var(--color-acc)' : 'var(--color-t3)',
                fontWeight: online ? 700 : 400,
                margin: 0,
                textTransform: online ? 'uppercase' : 'none',
                letterSpacing: online ? '0.06em' : 0,
              }}
            >
              {online ? 'Online' : formatLastSeen(otherProfile?.last_seen ?? null)}
            </p>
          </div>
        </div>

      </div>

      {/* ── Schedule Overlap Bar ─────────────────────────────────────────── */}
      {user?.id && otherUserId && (
        <ScheduleOverlapBar
          myUserId={user.id}
          otherUserId={otherUserId}
          otherName={conversationItem.displayName}
        />
      )}

      {/* ── Message scroll area ──────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        {loading && <LoadingSpinner />}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-red)',
              }}
            >
              {error}
            </p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-t3)',
              }}
            >
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {renderMessages(messages, handleAcceptProposal, handleAltProposal, handleDeclineProposal)}
      </div>

      {/* ── Composer ─────────────────────────────────────────────────────── */}
      <MessageComposer
        onSend={sendMessage}
        sending={sending}
        sendError={error}
        onSuggestTime={() => setSuggestOpen(true)}
      />

      {/* ── Suggest Time Sheet ───────────────────────────────────────────── */}
      <SuggestTimeSheet
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        onPropose={handleSendProposal}
        myUserId={user?.id ?? ''}
      />
    </div>
  );
}

// ─── Message list renderer with day separators ────────────────────────────────

function renderMessages(
  messages: MessageWithSender[],
  onAcceptProposal: (id: string) => void,
  onAltProposal: (id: string) => void,
  onDeclineProposal: (id: string) => void,
) {
  const nodes: React.ReactNode[] = [];

  messages.forEach((msg, i) => {
    const prev = messages[i - 1];

    // Insert a day separator when the date changes
    if (!prev || isDifferentDay(prev.message.created_at, msg.message.created_at)) {
      nodes.push(
        <DateSeparator key={`sep-${msg.message.id}`} date={msg.message.created_at} />
      );
    }

    // Show avatar only for first message in a consecutive group from same sender
    const prevIsSame =
      prev &&
      !prev.isMine &&
      !msg.isMine &&
      prev.message.sender_id === msg.message.sender_id;
    const showAvatar = !msg.isMine && !prevIsSame;

    nodes.push(
      <ChatBubble
        key={msg.message.id}
        msg={msg}
        showAvatar={showAvatar}
        onAcceptProposal={onAcceptProposal}
        onAltProposal={onAltProposal}
        onDeclineProposal={onDeclineProposal}
      />
    );
  });

  return nodes;
}

// ─── Day separator ────────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '12px 0 8px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--color-t3)',
          background: 'var(--color-surf-2)',
          borderRadius: 'var(--radius-full)',
          padding: '4px 12px',
        }}
      >
        {formatDaySeparator(date)}
      </span>
    </div>
  );
}

// ─── Header icon button ───────────────────────────────────────────────────────

function HeaderIconButton({
  children,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-surf-2)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-t1)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-full)',
          border: '2.5px solid var(--color-bdr)',
          borderTopColor: 'var(--color-acc)',
          animation: 'spin 0.7s linear infinite',
        }}
      />
    </div>
  );
}

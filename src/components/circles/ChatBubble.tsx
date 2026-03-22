import React from 'react';
import { Avatar, IconCheckCheck } from '../../design-system';
import { SportCard } from './SportCard';
import type { MessageWithSender, SportCardPayload } from '../../types/circles';
import { SPORT_CARD_PREFIX } from '../../types/circles';
import type { Profile } from '../../types/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Parses a sport card payload from a message content string */
function parseSportCard(content: string): SportCardPayload | null {
  if (!content.startsWith(SPORT_CARD_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(SPORT_CARD_PREFIX.length)) as SportCardPayload;
  } catch {
    return null;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatBubbleProps {
  msg: MessageWithSender;
  /** Show avatar on the left (true for first message in a group from same sender) */
  showAvatar: boolean;
  /** Pre-fetched profiles for sport card participants */
  participantProfiles?: Profile[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A single chat message bubble.
 * - Sent (isMine): right-aligned, accent green background
 * - Received: left-aligned, surface-2 background
 * - Sport card: renders SportCard component instead of text
 *
 * Corner radii follow the "tail" convention:
 * - Received: bottom-left corner flattened (points toward sender avatar)
 * - Sent: bottom-right corner flattened (visual tail)
 */
export function ChatBubble({ msg, showAvatar, participantProfiles = [] }: ChatBubbleProps) {
  const sportCard = parseSportCard(msg.message.content);
  const isTemp = msg.message.id.startsWith('temp-');

  if (msg.isMine) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          marginBottom: 4,
          paddingLeft: 48, // keep sent bubbles from stretching full width
        }}
      >
        {sportCard ? (
          <SportCard
            goal={sportCard.goal}
            sport={sportCard.sport}
            title={sportCard.title}
            description={sportCard.description}
            participants={participantProfiles}
          />
        ) : (
          <div
            style={{
              background: 'var(--color-acc)',
              color: '#fff',
              borderRadius: `var(--radius-2xl) var(--radius-2xl) var(--radius-sm) var(--radius-2xl)`,
              padding: '10px 14px',
              maxWidth: '100%',
              wordBreak: 'break-word',
              opacity: isTemp ? 0.7 : 1,
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {msg.message.content}
            </p>
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginTop: 3,
            marginRight: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: 'var(--color-t3)',
            }}
          >
            {formatTime(msg.message.created_at)}
          </span>
          {!isTemp && (
            <IconCheckCheck
              size={12}
              style={{ color: 'var(--color-acc)' }}
            />
          )}
        </div>
      </div>
    );
  }

  // ─── Received bubble ────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 4,
        paddingRight: 48,
      }}
    >
      {/* Sender avatar (shown only for first message in a group) */}
      <div style={{ width: 28, flexShrink: 0 }}>
        {showAvatar && (
          <Avatar
            name={msg.sender?.full_name ?? '?'}
            imageUrl={msg.sender?.avatar_url ?? undefined}
            size="sm"
          />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {sportCard ? (
          <SportCard
            goal={sportCard.goal}
            sport={sportCard.sport}
            title={sportCard.title}
            description={sportCard.description}
            participants={participantProfiles}
          />
        ) : (
          <div
            style={{
              background: 'var(--color-surf-2)',
              color: 'var(--color-t1)',
              borderRadius: `var(--radius-2xl) var(--radius-2xl) var(--radius-2xl) var(--radius-sm)`,
              padding: '10px 14px',
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.45,
                margin: 0,
              }}
            >
              {msg.message.content}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            color: 'var(--color-t3)',
            marginTop: 3,
            marginLeft: 2,
          }}
        >
          {formatTime(msg.message.created_at)}
        </span>
      </div>
    </div>
  );
}

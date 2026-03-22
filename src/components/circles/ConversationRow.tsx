import React from 'react';
import { Avatar } from '../../design-system';
import type { ConversationItem } from '../../types/circles';
import { SPORT_CARD_PREFIX } from '../../types/circles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getPreviewText(content: string | undefined | null): string {
  if (!content) return '';
  if (content.startsWith(SPORT_CARD_PREFIX)) return '🎾 Training goal';
  return content.length > 60 ? content.slice(0, 60) + '…' : content;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConversationRowProps {
  item: ConversationItem;
  onClick: (item: ConversationItem) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Single row in the Circles conversation list.
 * Follows the "no 1px border" design rule — separation is achieved purely
 * via vertical spacing (margin-bottom) and tonal background shifts.
 */
export function ConversationRow({ item, onClick }: ConversationRowProps) {
  const timestamp = formatTimestamp(item.lastActivity);
  const preview = getPreviewText(item.lastMessage?.content);
  const hasUnread = item.unreadCount > 0;

  return (
    <button
      onClick={() => onClick(item)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 16px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        // Subtle hover via background — no borders
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {/* Avatar + online dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar
          name={item.displayName}
          imageUrl={item.displayAvatarUrl ?? undefined}
          size="md"
        />
        {item.isOnline && (
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 11,
              height: 11,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-acc)',
              border: '2px solid var(--color-bg)',
            }}
          />
        )}
      </div>

      {/* Text content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 2,
          }}
        >
          {/* Name */}
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: hasUnread
                ? ('var(--weight-bold)' as React.CSSProperties['fontWeight'])
                : ('var(--weight-semibold)' as React.CSSProperties['fontWeight']),
              color: 'var(--color-t1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '60%',
            }}
          >
            {item.displayName}
          </span>

          {/* Timestamp */}
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-2xs)',
              color: hasUnread ? 'var(--color-acc)' : 'var(--color-t3)',
              fontWeight: hasUnread
                ? ('var(--weight-semibold)' as React.CSSProperties['fontWeight'])
                : ('var(--weight-regular)' as React.CSSProperties['fontWeight']),
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {timestamp}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Last message preview */}
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: hasUnread ? 'var(--color-t1)' : 'var(--color-t2)',
              fontWeight: hasUnread
                ? ('var(--weight-medium)' as React.CSSProperties['fontWeight'])
                : ('var(--weight-regular)' as React.CSSProperties['fontWeight']),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {preview || 'Start the conversation'}
          </span>

          {/* Unread badge */}
          {hasUnread && (
            <div
              style={{
                flexShrink: 0,
                marginLeft: 8,
                minWidth: 20,
                height: 20,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-acc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

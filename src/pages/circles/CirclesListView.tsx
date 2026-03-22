import React, { useState } from 'react';
import { Avatar, IconSearch, IconPencil } from '../../design-system';
import { StoriesStrip } from '../../components/circles/StoriesStrip';
import { ConversationRow } from '../../components/circles/ConversationRow';
import { useAuth } from '../../contexts/AuthContext';
import type { ConversationItem } from '../../types/circles';
import type { Profile } from '../../types/database';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CirclesListViewProps {
  conversations: ConversationItem[];
  loading: boolean;
  error: string | null;
  onOpenChat: (item: ConversationItem) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CirclesListView({ conversations, loading, error, onOpenChat }: CirclesListViewProps) {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? conversations.filter((c) =>
        c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastMessage?.content ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

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
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 8px',
          flexShrink: 0,
        }}
      >
        {/* User avatar */}
        <Avatar
          name={profile?.full_name ?? 'Me'}
          imageUrl={profile?.avatar_url ?? undefined}
          size="sm"
        />

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-t1)',
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Circles
        </h1>

        {/* Compose icon */}
        <button
          aria-label="New message"
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
            color: 'var(--color-acc)',
          }}
        >
          <IconPencil size={20} />
        </button>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surf-2)',
            borderRadius: 'var(--radius-full)',
            padding: '10px 14px',
          }}
        >
          <IconSearch size={15} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search interactions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-t1)',
            }}
          />
        </div>
      </div>

      {/* ── Stories strip ───────────────────────────────────────────────── */}
      {profile && (
        <div style={{ flexShrink: 0 }}>
          <StoriesStrip
            currentUser={profile as Profile}
            conversations={conversations}
          />
        </div>
      )}

      {/* ── Section label ────────────────────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div style={{ padding: '4px 16px 2px', flexShrink: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-2xs)',
              color: 'var(--color-t3)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Messages
          </span>
        </div>
      )}

      {/* ── Conversation list ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 8,
        } as React.CSSProperties}
      >
        {loading && <SkeletonList />}

        {!loading && error && (
          <ErrorBanner message={error} />
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState hasSearch={searchQuery.trim().length > 0} />
        )}

        {!loading &&
          !error &&
          filtered.map((item) => (
            <ConversationRow
              key={item.conversation.id}
              item={item}
              onClick={onOpenChat}
            />
          ))}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 0',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)',
              flexShrink: 0,
              animation: 'shimmer 1.4s ease-in-out infinite',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                height: 13,
                width: `${55 + i * 10}%`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surf-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: 11,
                width: `${40 + i * 8}%`,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surf-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        gap: 10,
      }}
    >
      <span style={{ fontSize: 40 }}>💬</span>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-t2)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {hasSearch
          ? 'No conversations match your search.'
          : 'No circles yet.\nConnect with players on Discover.'}
      </p>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: '12px 16px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-red-bg)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-red)',
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}

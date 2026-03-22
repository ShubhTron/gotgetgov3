import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../design-system';
import type { Profile } from '../../types/database';
import type { ConversationItem, StoryItem } from '../../types/circles';

// ─── Helper ───────────────────────────────────────────────────────────────────

function isOnlineNow(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function truncateName(name: string, max = 8): string {
  return name.length > max ? name.slice(0, max) + '…' : name;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StoriesStripProps {
  currentUser: Profile;
  conversations: ConversationItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Horizontal scrollable strip of story/status avatars — Instagram / WhatsApp style.
 *
 * - First slot: current user's avatar with a "+" overlay (add story, stub)
 * - Remaining slots: unique contacts from conversations, sorted by:
 *     1. Has active story (non-expired story row) first
 *     2. Then by last_seen recency
 * - A green ring (--color-acc) indicates an active story
 * - A small green dot indicates the user is online now
 */
export function StoriesStrip({ currentUser, conversations }: StoriesStripProps) {
  const [storyItems, setStoryItems] = useState<StoryItem[]>([]);

  useEffect(() => {
    buildStoryItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  async function buildStoryItems() {
    // Collect unique other participants across all conversations
    const seenIds = new Set<string>();
    const others: Profile[] = [];

    conversations.forEach((conv) => {
      conv.otherParticipants.forEach(({ profile }) => {
        if (!seenIds.has(profile.id)) {
          seenIds.add(profile.id);
          others.push(profile);
        }
      });
    });

    if (others.length === 0) {
      setStoryItems([]);
      return;
    }

    // Check which users have a non-expired story
    const now = new Date().toISOString();
    const { data: activeStories } = await supabase
      .from('stories')
      .select('user_id')
      .in(
        'user_id',
        others.map((p) => p.id)
      )
      .gt('expires_at', now);

    const activeStoryUserIds = new Set(
      (activeStories ?? []).map((s) => s.user_id)
    );

    const items: StoryItem[] = others.map((p) => ({
      userId: p.id,
      userName: p.full_name,
      avatarUrl: p.avatar_url,
      hasActiveStory: activeStoryUserIds.has(p.id),
      isCurrentUser: false,
      isOnline: isOnlineNow(p.last_seen),
    }));

    // Sort: active stories first, then by recency (online users next)
    items.sort((a, b) => {
      if (a.hasActiveStory !== b.hasActiveStory) return a.hasActiveStory ? -1 : 1;
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return 0;
    });

    setStoryItems(items);
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        padding: '4px 16px 8px',
        scrollbarWidth: 'none',
        // iOS momentum scroll
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}
    >
      {/* Current user's slot */}
      <StoryAvatar
        key="me"
        userId={currentUser.id}
        userName="You"
        avatarUrl={currentUser.avatar_url}
        hasActiveStory={false}
        isCurrentUser={true}
        isOnline={false}
      />

      {/* Contacts */}
      {storyItems.map((item) => (
        <StoryAvatar key={item.userId} {...item} />
      ))}
    </div>
  );
}

// ─── Single story avatar ──────────────────────────────────────────────────────

interface StoryAvatarProps extends StoryItem {}

function StoryAvatar({
  userName,
  avatarUrl,
  hasActiveStory,
  isCurrentUser,
  isOnline,
}: StoryAvatarProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      {/* Ring wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Story ring or plain circle */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 'var(--radius-full)',
            padding: hasActiveStory ? 2.5 : 0,
            background: hasActiveStory
              ? 'var(--color-acc)'
              : 'transparent',
            boxSizing: 'border-box',
          }}
        >
          {/* Inner white gap for story ring */}
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'var(--radius-full)',
              padding: hasActiveStory ? 2 : 0,
              background: hasActiveStory
                ? 'var(--color-bg)'
                : 'transparent',
              boxSizing: 'border-box',
            }}
          >
            <Avatar
              name={userName}
              imageUrl={avatarUrl ?? undefined}
              size="md"
            />
          </div>
        </div>

        {/* "+" overlay for current user */}
        {isCurrentUser && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 18,
              height: 18,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-acc)',
              border: '2px solid var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: '#fff',
                fontSize: 11,
                lineHeight: 1,
                fontWeight: 700,
                marginTop: -1,
              }}
            >
              +
            </span>
          </div>
        )}

        {/* Online dot for other users */}
        {!isCurrentUser && isOnline && (
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 10,
              height: 10,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-acc)',
              border: '2px solid var(--color-bg)',
            }}
          />
        )}
      </div>

      {/* Name label */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'var(--color-t2)',
          fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          letterSpacing: '0.02em',
          maxWidth: 52,
          textAlign: 'center',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {truncateName(userName)}
      </span>
    </div>
  );
}

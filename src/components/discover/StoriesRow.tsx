/**
 * StoriesRow Component - Instagram-Style Stories Interface
 *
 * Horizontal scrollable row of story avatars with gradient rings for unviewed stories
 * and gray rings for viewed stories.
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export interface StoryPlayer {
  id: string;
  fullName: string;
  avatarUrl?: string;
  isConnection?: boolean;
}

interface StoriesRowProps {
  storyPlayers: StoryPlayer[];
  storiesMap: Record<string, any[]>;
  onStoryClick: (playerId: string, tab: 'connections' | 'discover') => void;
  onYourStoryClick: () => void;
  userHasStory?: boolean;
  onViewOwnStory?: () => void;
  viewedStoryIds?: Set<string>;
}

type StoryTab = 'connections' | 'discover';

// Simple Avatar component for stories
function StoryAvatar({
  src,
  name,
  hasUnviewedStory,
  hasViewedStory,
  showPulse,
  onClick,
  ariaLabel,
}: {
  src?: string | null;
  name: string;
  hasUnviewedStory?: boolean;
  hasViewedStory?: boolean;
  showPulse?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const ringStyle: React.CSSProperties = hasUnviewedStory
    ? {
        background: 'linear-gradient(135deg, var(--color-acc) 0%, var(--color-acc) 100%)',
        padding: 2,
        borderRadius: 9999,
      }
    : hasViewedStory
    ? {
        background: 'var(--color-bdr)',
        padding: 2,
        borderRadius: 9999,
      }
    : {};

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        width: 64,
        height: 64,
        borderRadius: 9999,
        ...(hasUnviewedStory || hasViewedStory ? ringStyle : {}),
        position: 'relative',
      }}
      className={showPulse ? 'animate-pulse' : ''}
    >
      <div
        style={{
          width: hasUnviewedStory || hasViewedStory ? 56 : 64,
          height: hasUnviewedStory || hasViewedStory ? 56 : 64,
          borderRadius: 9999,
          overflow: 'hidden',
          background: 'var(--color-surf-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid var(--color-surf)`,
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--color-t1)',
            }}
          >
            {initials}
          </span>
        )}
      </div>
    </button>
  );
}

export function StoriesRow({
  storyPlayers,
  storiesMap,
  onStoryClick,
  onYourStoryClick,
  userHasStory,
  onViewOwnStory,
  viewedStoryIds = new Set(),
}: StoriesRowProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<StoryTab>('connections');

  const connectionPlayers = storyPlayers.filter((p) => p.isConnection !== false);
  const discoverPlayers = storyPlayers.filter((p) => p.isConnection === false);
  const visiblePlayers = activeTab === 'connections' ? connectionPlayers : discoverPlayers;

  const isUnread = (playerId: string) => {
    const stories = storiesMap[playerId] || [];
    return stories.some((s) => !viewedStoryIds.has(s.id));
  };

  const activeTabStyle: React.CSSProperties = {
    background: 'var(--color-acc)',
    color: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  };
  const inactiveTabStyle: React.CSSProperties = {
    background: 'var(--color-surf)',
    color: 'var(--color-t2)',
  };

  return (
    <div className="mb-4">
      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setActiveTab('connections')}
          className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
          style={activeTab === 'connections' ? activeTabStyle : inactiveTabStyle}
        >
          Friends
          {connectionPlayers.length > 0 && (
            <span
              className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
              style={
                activeTab === 'connections'
                  ? { background: 'rgba(255,255,255,0.3)' }
                  : { background: 'var(--color-acc-bg)', color: 'var(--color-acc)' }
              }
            >
              {connectionPlayers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
          style={activeTab === 'discover' ? activeTabStyle : inactiveTabStyle}
        >
          Nearby
          {discoverPlayers.length > 0 && (
            <span
              className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
              style={
                activeTab === 'discover'
                  ? { background: 'rgba(255,255,255,0.3)' }
                  : { background: 'var(--color-acc-bg)', color: 'var(--color-acc)' }
              }
            >
              {discoverPlayers.length}
            </span>
          )}
        </button>
      </div>

      {/* Story circles */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* Your Story — always first */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <StoryAvatar
              src={profile?.avatar_url || null}
              name={profile?.full_name || 'You'}
              hasUnviewedStory={userHasStory}
              onClick={() => {
                if (userHasStory && onViewOwnStory) {
                  onViewOwnStory();
                } else {
                  onYourStoryClick();
                }
              }}
              ariaLabel={userHasStory ? 'View your story' : 'Create your story'}
            />
            {/* Plus button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onYourStoryClick();
              }}
              className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center z-10"
              style={{
                backgroundColor: 'var(--color-acc)',
                borderRadius: 9999,
                border: `2px solid var(--color-surf)`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'opacity 0.15s',
              }}
              aria-label="Create new story"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-t2)' }}>
            Your Moment
          </span>
        </div>

        {/* Other players' stories */}
        {visiblePlayers.length === 0 ? (
          <div className="flex items-center text-xs py-8" style={{ color: 'var(--color-t3)' }}>
            {activeTab === 'connections' ? 'No friend moments yet' : 'No nearby moments yet'}
          </div>
        ) : (
          visiblePlayers.map((player) => {
            const hasUnviewed = isUnread(player.id);
            const hasViewed = !hasUnviewed && (storiesMap[player.id]?.length || 0) > 0;

            return (
              <div key={player.id} className="flex flex-col items-center gap-1.5 shrink-0">
                <StoryAvatar
                  src={player.avatarUrl || null}
                  name={player.fullName}
                  hasUnviewedStory={hasUnviewed}
                  hasViewedStory={hasViewed}
                  showPulse={hasUnviewed}
                  onClick={() => onStoryClick(player.id, activeTab)}
                  ariaLabel={`View ${player.fullName}'s story`}
                />
                <span
                  className="text-xs font-medium truncate w-16 text-center"
                  style={{ color: 'var(--color-t1)' }}
                >
                  {player.fullName.split(' ')[0]}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom divider */}
      <div className="mt-2" style={{ height: 1, background: 'var(--color-bdr)', opacity: 0.5 }} />
    </div>
  );
}

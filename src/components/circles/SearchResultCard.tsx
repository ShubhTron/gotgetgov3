import { useState, useEffect } from 'react';
import { MessageCircle, UserPlus, Check } from 'lucide-react';
import { PlayerCard, type Player } from '../discover/PlayerCard';
import { getConnectionStatus } from '@/lib/connections';
import type { Profile } from '@/types';

interface SearchResultCardProps {
  user: Profile;
  currentUserId: string;
  onFollow: (userId: string) => Promise<void>;
  onMessage: (userId: string) => void;
}

export function SearchResultCard({
  user,
  currentUserId,
  onFollow,
  onMessage,
}: SearchResultCardProps) {
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch connection status on mount
  useEffect(() => {
    async function fetchConnectionStatus() {
      const status = await getConnectionStatus(currentUserId, user.id);
      setConnectionStatus(status);
    }
    fetchConnectionStatus();
  }, [currentUserId, user.id]);

  // Handle follow action
  const handleFollow = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onFollow(user.id);
      setConnectionStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to follow user');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Profile to Player format for PlayerCard
  const player: Player = {
    id: user.id,
    fullName: user.full_name,
    avatarUrl: user.avatar_url || undefined,
    sport: 'tennis' as import('@/types').SportType,
    sportName: 'Tennis',
    level: 'intermediate',
    levelLabel: 'Intermediate',
    distanceKm: 0,
    isActiveRecently: false,
    availability: '',
    preferredTime: '',
    homeClub: '',
    scheduleOverlapLabel: '',
    compatibilityScore: 0,
    recentMatches: [],
    distance: 0,
    availabilityOverlap: 0,
    playStyle: user.bio || undefined,
  } as unknown as Player;

  return (
    <div className="relative">
      {/* PlayerCard as background */}
      <div className="h-[500px]">
        <PlayerCard player={player} />
      </div>

      {/* Action buttons overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex gap-3">
        {connectionStatus === 'none' && (
          <button
            onClick={handleFollow}
            disabled={isLoading}
            className="flex-1 text-white font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-acc)' }}
          >
            {isLoading ? (
              <>
                <div
                  className="w-5 h-5 rounded-full animate-spin"
                  style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                />
                <span>Following...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Follow</span>
              </>
            )}
          </button>
        )}

        {connectionStatus === 'accepted' && (
          <button
            disabled
            className="flex-1 font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 cursor-default text-white"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          >
            <Check className="w-5 h-5" />
            <span>Connected</span>
          </button>
        )}

        {connectionStatus === 'pending' && (
          <button
            disabled
            className="flex-1 font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 cursor-default text-white"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          >
            <span>Pending</span>
          </button>
        )}

        <button
          onClick={() => onMessage(user.id)}
          className="font-semibold py-3 px-6 rounded-full flex items-center justify-center gap-2 transition-colors text-white"
          style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Message</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="absolute top-4 left-4 right-4 px-4 py-3 rounded-lg shadow-lg"
          style={{ background: 'rgba(var(--color-red-rgb,239,68,68),0.9)', backdropFilter: 'blur(8px)' }}
        >
          <p className="text-sm font-medium text-white">{error}</p>
        </div>
      )}
    </div>
  );
}

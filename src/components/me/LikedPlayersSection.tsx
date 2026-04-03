import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import type { LikedPlayer } from '../../types/database';
import { SPORTS } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ width, height, radius = 'var(--radius-sm)' }: { width: string | number; height: number; radius?: string }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'var(--color-surf)',
      animation: 'shimmer 1.4s ease-in-out infinite',
      flexShrink: 0,
    }} />
  );
}

// ─── Player mini-card (shown when a row is tapped) ────────────────────────────

type ConnectState = 'idle' | 'loading' | 'sent' | 'error';

function PlayerMiniCard({ player, onClose }: { player: LikedPlayer; onClose: () => void }) {
  const { user } = useAuth();
  const [connectState, setConnectState] = useState<ConnectState>('idle');
  const initials = player.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sportName = (SPORTS as any)[player.sport]?.name ?? player.sport;

  const handleConnect = async () => {
    if (!user || connectState !== 'idle') return;
    setConnectState('loading');
    const { error } = await (supabase.from('swipe_matches') as any).upsert(
      { user_id: user.id, target_user_id: player.id, sport: player.sport, direction: 'right' },
      { onConflict: 'user_id,target_user_id,sport' },
    );
    if (error) {
      console.error('Connect failed:', error);
      setConnectState('error');
      setTimeout(() => setConnectState('idle'), 2000);
    } else {
      setConnectState('sent');
    }
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)',
        paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Handle */}
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)', marginBottom: 'var(--space-1)' }} />

      {/* Avatar */}
      <div style={{
        width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--color-acc-bg), rgba(13,158,80,0.25))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 0 4px var(--color-acc-bg)',
      }}>
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-acc)' }}>{initials}</span>
        }
      </div>

      {/* Name + sport */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--color-t1)', letterSpacing: 'var(--tracking-tight)' }}>
          {player.fullName}
        </div>
        <div style={{
          display: 'inline-block', marginTop: 6,
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 700,
          color: 'var(--color-acc)', background: 'var(--color-acc-bg)',
          borderRadius: 'var(--radius-full)', padding: '3px 10px',
          letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
        }}>
          {sportName}
        </div>
      </div>

      {/* Connect button */}
      <button
        onClick={handleConnect}
        disabled={connectState !== 'idle'}
        style={{
          width: '100%',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          cursor: connectState === 'idle' ? 'pointer' : 'default',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-wide)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.2s, opacity 0.2s',
          background: connectState === 'sent' ? 'var(--color-surf)' : connectState === 'error' ? 'rgba(220,38,38,0.15)' : 'var(--color-acc)',
          color: connectState === 'sent' ? 'var(--color-t2)' : connectState === 'error' ? '#ef4444' : '#fff',
          opacity: connectState === 'loading' ? 0.7 : 1,
        }}
      >
        {connectState === 'loading' && (
          <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        )}
        {connectState === 'idle' && <Zap size={16} />}
        {connectState === 'idle' && 'Send Connect Request'}
        {connectState === 'loading' && 'Sending…'}
        {connectState === 'sent' && '✓ Request Sent'}
        {connectState === 'error' && 'Failed — tap to retry'}
      </button>

      {/* Cancel */}
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)',
          color: 'var(--color-t3)', padding: 'var(--space-1)',
        }}
      >
        Cancel
      </button>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function LikedPlayerRow({ player, onTap }: { player: LikedPlayer; onTap: () => void }) {
  const initials = player.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sportName = (SPORTS as any)[player.sport]?.name ?? player.sport;

  return (
    <button
      onClick={onTap}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-5)',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--color-acc-bg), rgba(13,158,80,0.25))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-acc)' }}>{initials}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.fullName}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-t3)', marginTop: 2 }}>
          {sportName}
        </div>
      </div>
      <Zap size={14} style={{ color: 'var(--color-acc)', flexShrink: 0, opacity: 0.6 }} />
    </button>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

interface LikedPlayersSectionProps {
  likedPlayers: LikedPlayer[];
  loading: boolean;
  open: boolean;
  onClose: () => void;
}

export function LikedPlayersSection({ likedPlayers, loading, open, onClose }: LikedPlayersSectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<LikedPlayer | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPlayer) setSelectedPlayer(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, selectedPlayer]);

  // Reset selected player when sheet closes
  useEffect(() => { if (!open) setSelectedPlayer(null); }, [open]);

  if (!open) return null;

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (selectedPlayer) setSelectedPlayer(null);
      else onClose();
    }
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      {/* Player mini-card (nested sheet) */}
      {selectedPlayer ? (
        <div style={{ width: '100%' }}>
          <PlayerMiniCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
        </div>
      ) : (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxHeight: '75vh',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3) 0 var(--space-1)' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)' }} />
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-5) var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-t1)', letterSpacing: 'var(--tracking-tight)' }}>
              Liked Players
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)', padding: 4, lineHeight: 1 }} aria-label="Close">
              ✕
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--color-bdr)' }} />

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', padding: 'var(--space-3) var(--space-5)' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0' }}>
                    <Skeleton width={48} height={48} radius="50%" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton width={120} height={14} />
                      <Skeleton width={72} height={11} />
                    </div>
                  </div>
                ))}
              </div>
            ) : likedPlayers.length === 0 ? (
              <div style={{ padding: 'var(--space-8) var(--space-5)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 'var(--space-3)' }}>🤍</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-t3)' }}>
                  No liked players yet. Tap the heart on Discover to save players here.
                </div>
              </div>
            ) : (
              <div style={{ paddingBottom: 'var(--space-4)' }}>
                {likedPlayers.map((player, i) => (
                  <div key={`${player.id}-${player.sport}`}>
                    <LikedPlayerRow player={player} onTap={() => setSelectedPlayer(player)} />
                    {i < likedPlayers.length - 1 && (
                      <div style={{ height: 1, background: 'var(--color-bdr)', marginLeft: 76 }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

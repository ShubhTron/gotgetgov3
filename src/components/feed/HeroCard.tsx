import { Share2, MoreVertical, MapPin, TrendingUp, Clock } from 'lucide-react';
import type { Match, Profile, Club } from '@/types/database';
import { formatRelativeTime } from '@/lib/feed-utils';
import { getInitials } from '@/lib/avatar-utils';

interface HeroCardProps {
  match: Match;
  opponent: Profile;
  club: Club | null;
  eloChange: number;
  onShareClick: () => void;
  onOptionsClick: () => void;
}

export function HeroCard({
  match,
  opponent,
  club,
  eloChange,
  onShareClick,
  onOptionsClick,
}: HeroCardProps) {
  // Format sport name for display
  const sportName = match.sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  
  // Calculate time elapsed (placeholder - would need actual match duration)
  const timeElapsed = '1h 23m';
  
  // Get score from match data
  const score = match.score as { team1?: number; team2?: number } | null;
  const scoreDisplay = score ? `${score.team1 || 0} - ${score.team2 || 0}` : 'N/A';
  
  // Determine if user won
  const isWin = match.winner_team !== null;

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--color-t1)',
        borderRadius: '22px 22px 0 0',
        padding: '20px 20px 18px',
        overflow: 'hidden',
      }}
    >
      {/* Radial green glow effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 80% 0%, rgba(22,212,106,0.18) 0%, transparent 60%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Content container */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Eyebrow label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-t3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Match Result
          </span>
          <span style={{ color: 'var(--color-t3)', fontSize: 11 }}>·</span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-t3)',
            }}
          >
            {sportName}
          </span>
          <span style={{ color: 'var(--color-t3)', fontSize: 11 }}>·</span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-t3)',
            }}
          >
            {formatRelativeTime(match.played_at || match.created_at)}
          </span>
        </div>

        {/* Headline with score badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 600,
              color: 'var(--color-bg)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            You vs{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--color-acc)' }}>
              {opponent.full_name}
            </span>
          </h2>

          {/* Score badge */}
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 99,
              background: isWin ? 'var(--color-acc)' : 'var(--color-surf-2)',
              border: isWin ? 'none' : '1px solid var(--color-bdr)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 700,
                color: isWin ? 'var(--color-t1)' : 'var(--color-t1)',
              }}
            >
              {scoreDisplay}
            </span>
          </div>
        </div>

        {/* Venue subtitle */}
        {club && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 400,
              color: 'var(--color-t3)',
              margin: '0 0 16px 0',
            }}
          >
            {club.name}
            {club.city && ` · ${club.city}`}
          </p>
        )}

        {/* Pill badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          {/* Time elapsed pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 99,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Clock size={12} style={{ color: 'var(--color-t3)' }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-t3)',
              }}
            >
              {timeElapsed}
            </span>
          </div>

          {/* ELO change pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 99,
              background: eloChange > 0 ? 'rgba(22,212,106,0.15)' : 'rgba(232,64,64,0.15)',
              border: `1px solid ${eloChange > 0 ? 'rgba(22,212,106,0.3)' : 'rgba(232,64,64,0.3)'}`,
            }}
          >
            <TrendingUp
              size={12}
              style={{
                color: eloChange > 0 ? 'var(--color-acc)' : 'var(--color-red)',
                transform: eloChange < 0 ? 'rotate(180deg)' : 'none',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 700,
                color: eloChange > 0 ? 'var(--color-acc)' : 'var(--color-red)',
              }}
            >
              {eloChange > 0 ? '+' : ''}
              {eloChange}
            </span>
          </div>

          {/* Location pill */}
          {club?.city && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 10px',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <MapPin size={12} style={{ color: 'var(--color-t3)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-t3)',
                }}
              >
                {club.city}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Share Result button */}
          <button
            onClick={onShareClick}
            aria-label="Share Result"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 99,
              background: 'var(--color-acc)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'background 0.2s',
              padding: '0 20px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-acc-dk)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-acc)';
            }}
          >
            <Share2 size={18} style={{ color: 'var(--color-t1)' }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--color-t1)',
              }}
            >
              Share Result
            </span>
          </button>

          {/* Options button */}
          <button
            onClick={onOptionsClick}
            aria-label="More options"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
          >
            <MoreVertical size={20} style={{ color: 'var(--color-t3)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

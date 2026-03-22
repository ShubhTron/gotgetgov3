import React from 'react';
import { Avatar } from '../../design-system';
import type { Profile } from '../../types/database';

// ─── Sport emoji map ──────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<string, string> = {
  tennis: '🎾',
  padel: '🏓',
  squash: '🏸',
  pickleball: '🏓',
  golf: '⛳',
  badminton: '🏸',
  table_tennis: '🏓',
  platform_tennis: '🎾',
  racquetball_squash57: '🏸',
  beach_tennis: '🎾',
  real_tennis: '🎾',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SportCardProps {
  goal: string;
  sport: string;
  title: string;
  description: string;
  /** Profiles of session participants (pre-fetched by caller) */
  participants: Profile[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Inline sport/training goal card that appears inside a chat thread.
 * Stored in the DB as a regular message with prefix __SPORT_CARD__:{json}
 */
export function SportCard({
  goal,
  sport,
  title,
  description,
  participants,
}: SportCardProps) {
  const emoji = SPORT_EMOJI[sport] ?? '🏅';

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: 'var(--radius-2xl)',
        padding: '14px 16px',
        maxWidth: 280,
        // Tonal separation — no border
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header row: goal label + sport emoji */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--color-acc)',
            textTransform: 'uppercase',
          }}
        >
          {goal}
        </span>
        <span style={{ fontSize: 18 }}>{emoji}</span>
      </div>

      {/* Title */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-md)',
          fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
          color: 'var(--color-t1)',
          margin: '0 0 4px',
          lineHeight: 1.25,
        }}
      >
        {title}
      </p>

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-t2)',
          margin: '0 0 10px',
          lineHeight: 1.45,
        }}
      >
        {description}
      </p>

      {/* Participant avatars */}
      {participants.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Overlapping avatars */}
          <div style={{ display: 'flex' }}>
            {participants.slice(0, 3).map((p, i) => (
              <div
                key={p.id}
                style={{
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: participants.length - i,
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--color-surf)',
                }}
              >
                <Avatar name={p.full_name} imageUrl={p.avatar_url ?? undefined} size="sm" />
              </div>
            ))}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              color: 'var(--color-t2)',
              marginLeft: 4,
            }}
          >
            Confirmed Session
          </span>
        </div>
      )}
    </div>
  );
}

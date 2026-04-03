import { Calendar, Clock, MapPin } from 'lucide-react';
import type { FeedChallenge } from '@/types/feed';
import { getInitials, formatRelativeTime } from '@/lib/feed-utils';

interface ChallengeCardProps {
  challenge: FeedChallenge;
  onRespondClick: () => void;
}

export function ChallengeCard({ challenge, onRespondClick }: ChallengeCardProps) {
  const { challenger, isNew, distance } = challenge;
  const { sport, confirmed_time, created_at } = challenge.challenge;

  // Format sport name for display
  const sportName = sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Get player initials for avatar
  const initials = getInitials(challenger.full_name);

  // Get ELO rating from user sport profile (placeholder - would need to fetch)
  const eloRating = '1450'; // TODO: Fetch from user_sport_profiles

  // Format date/time
  const dateTime = confirmed_time || created_at;
  const formattedTime = formatRelativeTime(dateTime);

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: '16px',
        border: '1px solid var(--color-bdr)',
        boxShadow: '0 1px 4px rgba(20,18,14,0.06), 0 6px 20px rgba(20,18,14,0.07)',
        padding: '13px 14px',
        marginBottom: '8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        {/* Avatar with initials */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'var(--color-acc-bg)',
            border: '1px solid var(--color-acc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-acc-dk)',
            }}
          >
            {initials}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Player name and New badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--color-t1)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {challenger.full_name}
            </h3>
            {isNew && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: 'var(--color-acc)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--color-t1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  flexShrink: 0,
                }}
              >
                New
              </span>
            )}
          </div>

          {/* Sport, ELO, Distance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-t2)',
              }}
            >
              {sportName}
            </span>
            <span style={{ color: 'var(--color-t3)', fontSize: 13 }}>·</span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-t2)',
              }}
            >
              ELO {eloRating}
            </span>
            {distance > 0 && (
              <>
                <span style={{ color: 'var(--color-t3)', fontSize: 13 }}>·</span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-t2)',
                  }}
                >
                  {distance} mi
                </span>
              </>
            )}
          </div>

          {/* Date/Time pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {/* Time pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 99,
                background: 'var(--color-surf-2)',
                border: '1px solid var(--color-bdr)',
              }}
            >
              <Clock size={12} style={{ color: 'var(--color-t2)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-t2)',
                }}
              >
                {formattedTime}
              </span>
            </div>

            {/* Date pill (if confirmed_time exists) */}
            {confirmed_time && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 99,
                  background: 'var(--color-surf-2)',
                  border: '1px solid var(--color-bdr)',
                }}
              >
                <Calendar size={12} style={{ color: 'var(--color-t2)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-t2)',
                  }}
                >
                  {new Date(confirmed_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Respond button */}
        <button
          onClick={onRespondClick}
          aria-label="Respond to challenge"
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 99,
            background: 'var(--color-acc)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
            alignSelf: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-acc-dk)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-acc)';
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-t1)',
            }}
          >
            Respond
          </span>
        </button>
      </div>
    </div>
  );
}

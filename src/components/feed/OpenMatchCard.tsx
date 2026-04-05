import { Clock, MapPin } from 'lucide-react';
import type { FeedOpenMatch } from '@/types/feed';
import { getInitials, formatRelativeTime } from '@/lib/feed-utils';

interface OpenMatchCardProps {
  openMatch: FeedOpenMatch;
  onJoinClick: () => void;
}

export function OpenMatchCard({ openMatch, onJoinClick }: OpenMatchCardProps) {
  const { host, distance } = openMatch;
  const { sport, confirmed_time, created_at } = openMatch.challenge;

  const sportName = sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const initials = getInitials(host.full_name);
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
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--color-acc-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-acc)',
          }}
        >
          {initials}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + sport pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <h3
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-t1)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {host.full_name}
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 99,
              background: 'var(--color-surf-2)',
              border: '1px solid var(--color-bdr)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-t2)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {sportName}
          </span>
        </div>

        {/* Time + distance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-t3)',
              }}
            >
              {formattedTime}
            </span>
          </div>

          {distance > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-t3)',
                }}
              >
                {distance} mi
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Join button */}
      <button
        onClick={onJoinClick}
        aria-label="Join match"
        style={{
          height: 34,
          padding: '0 14px',
          borderRadius: 99,
          background: 'var(--color-acc)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s',
          flexShrink: 0,
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
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-t1)',
          }}
        >
          Join
        </span>
      </button>
    </div>
  );
}

import { Calendar, Clock, MapPin } from 'lucide-react';
import type { FeedOpenMatch } from '@/types/feed';
import { getInitials, formatRelativeTime } from '@/lib/feed-utils';

interface OpenMatchCardProps {
  openMatch: FeedOpenMatch;
  onJoinClick: () => void;
}

export function OpenMatchCard({ openMatch, onJoinClick }: OpenMatchCardProps) {
  const { host, distance } = openMatch;
  const { sport, confirmed_time, created_at } = openMatch.challenge;

  // Format sport name for display
  const sportName = sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Get player initials for avatar
  const initials = getInitials(host.full_name);

  // Format date/time
  const dateTime = confirmed_time || created_at;
  const formattedTime = formatRelativeTime(dateTime);

  return (
    <div
      style={{
        width: 148,
        background: 'var(--color-surf)',
        borderRadius: '18px',
        border: '1px solid var(--color-bdr)',
        boxShadow: '0 1px 4px rgba(20,18,14,0.06), 0 6px 20px rgba(20,18,14,0.07)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        flexShrink: 0,
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

      {/* Player name */}
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
        {host.full_name}
      </h3>

      {/* Sport pill badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: 99,
          background: 'var(--color-acc)',
          alignSelf: 'flex-start',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-t1)',
          }}
        >
          {sportName}
        </span>
      </div>

      {/* Date/Time/Distance details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {/* Date pill */}
        {confirmed_time && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Calendar size={12} style={{ color: 'var(--color-t2)', flexShrink: 0 }} />
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

        {/* Time pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Clock size={12} style={{ color: 'var(--color-t2)', flexShrink: 0 }} />
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

        {/* Distance pill */}
        {distance > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MapPin size={12} style={{ color: 'var(--color-t2)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-t2)',
              }}
            >
              {distance} mi
            </span>
          </div>
        )}
      </div>

      {/* Join Match button */}
      <button
        onClick={onJoinClick}
        aria-label="Join match"
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
          marginTop: 'auto',
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
          Join Match
        </span>
      </button>
    </div>
  );
}

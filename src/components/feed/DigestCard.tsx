import type { FeedDigestMatch } from '@/types/feed';
import { getInitials, formatRelativeTime } from '@/lib/feed-utils';

interface DigestRowProps {
  match: FeedDigestMatch;
  isFirst: boolean;
}

function DigestRow({ match, isFirst }: DigestRowProps) {
  const { opponent, club, isWin } = match;
  const { score, played_at, created_at } = match.match;

  // Get opponent initials for avatar
  const initials = getInitials(opponent.full_name);

  // Get score from match data
  const scoreData = score as { team1?: number; team2?: number } | null;
  const scoreDisplay = scoreData ? `${scoreData.team1 || 0} - ${scoreData.team2 || 0}` : 'N/A';

  // Format time/date
  const timeDate = formatRelativeTime(played_at || created_at);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderTop: isFirst ? 'none' : '1px solid var(--color-bdr)',
      }}
    >
      {/* Win/Loss badge */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: isWin ? 'var(--color-acc)' : 'var(--color-red)',
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
            color: 'white',
          }}
        >
          {isWin ? 'W' : 'L'}
        </span>
      </div>

      {/* Match information */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Opponent name */}
        <h4
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-t1)',
            margin: 0,
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {opponent.full_name}
        </h4>

        {/* Venue details */}
        {club && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--color-t2)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {club.name}
            {club.city && ` · ${club.city}`}
          </p>
        )}
      </div>

      {/* Score and time/date */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {/* Score */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--color-t1)',
          }}
        >
          {scoreDisplay}
        </span>

        {/* Time/Date */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-t2)',
          }}
        >
          {timeDate}
        </span>
      </div>
    </div>
  );
}

interface DigestCardProps {
  matches: FeedDigestMatch[];
}

export function DigestCard({ matches }: DigestCardProps) {
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: '18px',
        border: '1px solid var(--color-bdr)',
        boxShadow: '0 1px 4px rgba(20,18,14,0.06), 0 6px 20px rgba(20,18,14,0.07)',
        overflow: 'hidden',
      }}
    >
      {matches.map((match, index) => (
        <DigestRow key={match.match.id} match={match} isFirst={index === 0} />
      ))}
    </div>
  );
}

// Export DigestRow for testing purposes
export { DigestRow };

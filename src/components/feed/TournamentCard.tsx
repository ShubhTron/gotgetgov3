import { Calendar, Users, Trophy } from 'lucide-react';
import type { FeedTournament } from '@/types/feed';

interface TournamentCardProps {
  tournament: FeedTournament;
  onEnterClick: () => void;
}

export function TournamentCard({ tournament, onEnterClick }: TournamentCardProps) {
  const { competition, club, spotsLeft } = tournament;

  // Format sport name for display
  const sportName = competition.sport.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Format date range
  const startDate = new Date(competition.start_date);
  const endDate = competition.end_date ? new Date(competition.end_date) : null;
  const dateRange = endDate
    ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculate participant count
  const maxParticipants = competition.max_participants || 0;
  const currentParticipants = maxParticipants - spotsLeft;

  // Format skill level
  const skillLevel = competition.min_skill_level && competition.max_skill_level
    ? `${competition.min_skill_level}-${competition.max_skill_level}`
    : competition.min_skill_level
    ? `${competition.min_skill_level}+`
    : 'All Levels';

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: '16px',
        border: '1px solid var(--color-bdr)',
        boxShadow: '0 1px 4px rgba(20,18,14,0.06), 0 6px 20px rgba(20,18,14,0.07)',
        padding: '12px 16px',
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
        {/* Trophy icon */}
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
          <Trophy size={20} style={{ color: 'var(--color-acc)' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tournament name */}
          <h3
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-t1)',
              margin: 0,
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {competition.name}
          </h3>

          {/* Sport and skill level */}
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
              {skillLevel}
            </span>
          </div>

          {/* Details pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {/* Date pill */}
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
                {dateRange}
              </span>
            </div>

            {/* Player count pill */}
            {maxParticipants > 0 && (
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
                <Users size={12} style={{ color: 'var(--color-t2)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-t2)',
                  }}
                >
                  {currentParticipants}/{maxParticipants}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enter/Join button */}
        <button
          onClick={onEnterClick}
          aria-label="Enter tournament"
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
            Enter
          </span>
        </button>
      </div>
    </div>
  );
}

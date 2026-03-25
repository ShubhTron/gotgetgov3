import { Chip } from '../../design-system';
import { IconArrowRight } from '../../design-system/icons';
import { SPORTS, SKILL_LEVELS } from '../../types';
import type { SportType } from '../../types/database';

// ─── Sport emoji map ──────────────────────────────────────────────────────────

const SPORT_EMOJI: Record<string, string> = {
  platform_tennis: '🎾',
  padel: '🏓',
  tennis: '🎾',
  squash: '🟡',
  pickleball: '🏸',
  golf: '⛳',
  badminton: '🏸',
  table_tennis: '🏓',
  racquetball_squash57: '🎾',
  beach_tennis: '🏖️',
  real_tennis: '🎾',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SportRowProps {
  sport: SportType;
  selfAssessedLevel: string;
  officialRating: string | null;
  officialRatingSystem: string | null;
  onPress: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SportRow({
  sport,
  selfAssessedLevel,
  officialRating,
  officialRatingSystem,
  onPress,
}: SportRowProps) {
  const sportName = SPORTS[sport]?.name ?? sport;
  const levelLabel =
    SKILL_LEVELS.find((s) => s.value === selfAssessedLevel)?.label ??
    selfAssessedLevel;
  const ratingDisplay =
    officialRating
      ? officialRatingSystem
        ? `${officialRatingSystem}: ${officialRating}`
        : officialRating
      : null;

  return (
    <button
      onClick={onPress}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-4) var(--space-5)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Sport emoji icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surf-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        {SPORT_EMOJI[sport] ?? '🎾'}
      </div>

      {/* Sport name + rating */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-t1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {sportName}
        </div>
        {ratingDisplay && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-t2)',
              marginTop: 2,
            }}
          >
            {ratingDisplay}
          </div>
        )}
      </div>

      {/* Level chip */}
      <Chip label={levelLabel} variant="neutral" />

      {/* Chevron */}
      <IconArrowRight
        size={14}
        style={{ color: 'var(--color-t3)', flexShrink: 0 }}
      />
    </button>
  );
}

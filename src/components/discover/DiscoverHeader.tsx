interface DiscoverHeaderProps {
  maxDistance?: number;
  skillTolerance?: number;
  onDistanceClick?: () => void;
  onSkillClick?: () => void;
  isGuest?: boolean;
  guestSwipeCount?: number;
}

export function DiscoverHeader({
  maxDistance,
  skillTolerance,
  onDistanceClick,
  onSkillClick,
  isGuest = false,
  guestSwipeCount = 0,
}: DiscoverHeaderProps) {
  const getDistanceText = () => {
    if (maxDistance === undefined) return '25 miles';
    if (maxDistance === 0) return 'Club only';
    if (maxDistance >= 100) return 'Any distance';
    return `${maxDistance} miles`;
  };

  const getSkillText = () => {
    if (skillTolerance === undefined) return '±2 levels';
    if (skillTolerance === 0) return 'Same level';
    if (skillTolerance === 3) return 'Any skill';
    return `±${skillTolerance} level${skillTolerance !== 1 ? 's' : ''}`;
  };

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: 8,
    background: 'var(--color-acc-bg)',
    color: 'var(--color-acc)',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '0.95rem',
    letterSpacing: '0.04em',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms ease',
  };

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--color-t1)',
            margin: 0,
          }}
        >
          Discover
        </h1>
      </div>

      {/* Subtitle with tappable chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          fontWeight: 500,
          letterSpacing: '0.03em',
          color: 'var(--color-t2)',
          marginBottom: 16,
        }}
      >
        <span>Players within</span>
        <button
          onClick={onDistanceClick}
          aria-label={`Filter by distance: ${getDistanceText()}`}
          style={chipStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--color-acc) 20%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-acc-bg)';
          }}
        >
          {getDistanceText()}
        </button>
        <span>of</span>
        <button
          onClick={onSkillClick}
          aria-label={`Filter by skill: ${getSkillText()}`}
          style={chipStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'color-mix(in srgb, var(--color-acc) 20%, transparent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-acc-bg)';
          }}
        >
          {getSkillText()}
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--color-bdr)', opacity: 0.6 }} />
    </div>
  );
}

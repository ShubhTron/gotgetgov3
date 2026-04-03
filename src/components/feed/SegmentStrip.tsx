import type { NewsFilter } from '@/types/feed';

interface SegmentStripProps {
  activeFilter: NewsFilter;
  onFilterChange: (filter: NewsFilter) => void;
}

interface FilterOption {
  value: NewsFilter;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'challenges', label: 'Challenges' },
  { value: 'results', label: 'Results' },
  { value: 'near_me', label: 'Near Me' },
  { value: 'tournaments', label: 'Tournaments' },
];

export function SegmentStrip({ activeFilter, onFilterChange }: SegmentStripProps) {
  return (
    <div
      style={{
        position: 'relative',
        margin: '0 -16px',
        padding: '12px 0',
      }}
    >
      {/* Scrollable container */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '0 16px 4px',
        }}
        className="hide-scrollbar"
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              aria-label={`Filter by ${option.label}`}
              aria-pressed={isActive}
              style={{
                height: 30,
                padding: '0 13px',
                borderRadius: 99,
                background: isActive ? 'var(--color-t1)' : 'var(--color-surf)',
                color: isActive ? 'var(--color-bg)' : 'var(--color-t2)',
                border: isActive ? 'none' : '1px solid var(--color-bdr)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--color-surf-2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--color-surf)';
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Right-edge fade indicator */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 12,
          bottom: 4,
          width: 48,
          background: 'linear-gradient(to right, transparent, var(--color-bg))',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

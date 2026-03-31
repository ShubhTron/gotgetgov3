import { SectionHeader } from './SectionHeader';
import { OpenMatchCard } from './OpenMatchCard';
import type { FeedOpenMatch } from '@/types/feed';

interface OpenMatchesSectionProps {
  openMatches: FeedOpenMatch[];
  onJoinClick: (openMatch: FeedOpenMatch) => void;
  onSeeAllClick?: () => void;
}

export function OpenMatchesSection({
  openMatches,
  onJoinClick,
  onSeeAllClick,
}: OpenMatchesSectionProps) {
  // Don't render if no open matches
  if (!openMatches || openMatches.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        label="Open Matches Near You"
        linkText={onSeeAllClick ? "See All" : undefined}
        onLinkClick={onSeeAllClick}
      />
      
      {/* Horizontal scroll container with fade indicator */}
      <div
        style={{
          position: 'relative',
          margin: '0 -16px',
          padding: '0 16px',
        }}
      >
        {/* Scrollable container */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            paddingBottom: 4,
            paddingRight: 32, // Extra padding to prevent clipping
          }}
          className="hide-scrollbar"
        >
          {openMatches.map((openMatch) => (
            <OpenMatchCard
              key={openMatch.challenge.id}
              openMatch={openMatch}
              onJoinClick={() => onJoinClick(openMatch)}
            />
          ))}
        </div>

        {/* Fade indicator on the right */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 4,
            width: 48,
            background: 'linear-gradient(to right, transparent, var(--color-bg))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
          aria-hidden="true"
        />
      </div>

      {/* CSS to hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

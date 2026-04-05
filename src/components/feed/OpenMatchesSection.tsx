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
      
      <div>
        {openMatches.map((openMatch) => (
          <OpenMatchCard
            key={openMatch.challenge.id}
            openMatch={openMatch}
            onJoinClick={() => onJoinClick(openMatch)}
          />
        ))}
      </div>
    </section>
  );
}

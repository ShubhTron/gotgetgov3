import { SectionHeader } from './SectionHeader';
import { DigestCard } from './DigestCard';
import type { FeedDigestMatch } from '@/types/feed';

interface DigestSectionProps {
  matches: FeedDigestMatch[];
  onSeeAllClick?: () => void;
}

export function DigestSection({ matches, onSeeAllClick }: DigestSectionProps) {
  // Don't render if no matches
  if (!matches || matches.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        label="This Week"
        linkText={onSeeAllClick ? "See All" : undefined}
        onLinkClick={onSeeAllClick}
      />
      
      <DigestCard matches={matches} />
    </section>
  );
}

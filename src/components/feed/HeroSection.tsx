import { SectionHeader } from './SectionHeader';
import { HeroCard } from './HeroCard';
import { ELOStrip } from './ELOStrip';
import type { FeedHeroMatch } from '@/types/feed';

interface HeroSectionProps {
  heroMatch: FeedHeroMatch | null;
  onShareClick: () => void;
  onOptionsClick: () => void;
  onSeeAllClick?: () => void;
}

export function HeroSection({
  heroMatch,
  onShareClick,
  onOptionsClick,
  onSeeAllClick,
}: HeroSectionProps) {
  // Don't render if no hero match data
  if (!heroMatch) {
    return null;
  }

  const { match, opponent, club, eloChange, currentElo, sparklineData } = heroMatch;

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        label="Your Highlight"
        linkText={onSeeAllClick ? "See All" : undefined}
        onLinkClick={onSeeAllClick}
      />
      
      <div>
        <HeroCard
          match={match}
          opponent={opponent}
          club={club}
          eloChange={eloChange}
          onShareClick={onShareClick}
          onOptionsClick={onOptionsClick}
        />
        <ELOStrip
          eloChange={eloChange}
          currentElo={currentElo}
          sparklineData={sparklineData}
        />
      </div>
    </section>
  );
}

import { SectionHeader } from './SectionHeader';
import { ChallengeCard } from './ChallengeCard';
import type { FeedChallenge } from '@/types/feed';

interface ChallengesSectionProps {
  challenges: FeedChallenge[];
  onRespondClick: (challenge: FeedChallenge) => void;
  onSeeAllClick?: () => void;
}

export function ChallengesSection({
  challenges,
  onRespondClick,
  onSeeAllClick,
}: ChallengesSectionProps) {
  // Don't render if no challenges
  if (!challenges || challenges.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        label="Challenges"
        linkText={onSeeAllClick ? "See All" : undefined}
        onLinkClick={onSeeAllClick}
      />
      
      <div>
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.challenge.id}
            challenge={challenge}
            onRespondClick={() => onRespondClick(challenge)}
          />
        ))}
      </div>
    </section>
  );
}

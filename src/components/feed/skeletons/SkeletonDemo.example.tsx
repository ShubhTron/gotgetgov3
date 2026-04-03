/**
 * Demo component to visualize all skeleton loaders
 * This is for development/testing purposes only
 */

import {
  HeroSectionSkeleton,
  ChallengesSectionSkeleton,
  OpenMatchesSectionSkeleton,
  DigestSectionSkeleton,
  TournamentsSectionSkeleton,
} from './index';

export function SkeletonDemo() {
  return (
    <div style={{ padding: '16px', background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 24, fontFamily: 'var(--font-display)' }}>
        Feed Skeleton Loaders
      </h1>
      
      <HeroSectionSkeleton />
      <ChallengesSectionSkeleton />
      <OpenMatchesSectionSkeleton />
      <DigestSectionSkeleton />
      <TournamentsSectionSkeleton />
    </div>
  );
}

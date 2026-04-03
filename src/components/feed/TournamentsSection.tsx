import { SectionHeader } from './SectionHeader';
import { TournamentCard } from './TournamentCard';
import type { FeedTournament } from '@/types/feed';

interface TournamentsSectionProps {
  tournaments: FeedTournament[];
  onEnterClick: (tournament: FeedTournament) => void;
  onSeeAllClick?: () => void;
}

export function TournamentsSection({
  tournaments,
  onEnterClick,
  onSeeAllClick,
}: TournamentsSectionProps) {
  // Don't render if no tournaments
  if (!tournaments || tournaments.length === 0) {
    return null;
  }

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        label="Tournaments Near You"
        linkText={onSeeAllClick ? "See All" : undefined}
        onLinkClick={onSeeAllClick}
      />
      
      <div>
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament.competition.id}
            tournament={tournament}
            onEnterClick={() => onEnterClick(tournament)}
          />
        ))}
      </div>
    </section>
  );
}

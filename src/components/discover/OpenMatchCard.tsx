import { MapPin, Clock, Calendar, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SPORTS, type SportType } from '@/types';
import { getInitials } from '@/lib/avatar-utils';

export interface OpenMatch {
  id: string;
  sport: SportType;
  format: 'singles' | 'doubles';
  proposedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
    level?: string;
  };
  location?: string;
  clubName?: string;
  proposedTimes: string[];
  message?: string;
  spotsNeeded: number;
}

interface OpenMatchCardProps {
  match: OpenMatch;
  onJoin: () => void;
  joining?: boolean;
}

export function OpenMatchCard({ match, onJoin, joining }: OpenMatchCardProps) {
  const sport = SPORTS[match.sport];

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  return (
    <div
      className="h-full w-full relative select-none flex flex-col"
      style={{ background: 'var(--color-acc-bg)' }}
    >
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ background: 'var(--color-acc-bg)', color: 'var(--color-acc)' }}
            >
              Open Match
            </span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.5)', color: 'var(--color-t1)' }}
            >
              {match.format === 'singles' ? 'Singles' : 'Doubles'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Avatar size="lg">
            <AvatarImage src={match.proposedBy.avatarUrl} />
            <AvatarFallback>{getInitials(match.proposedBy.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-t1)' }}>
              {match.proposedBy.name}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-t2)' }}>
              {sport?.name || match.sport}{match.proposedBy.level && ` - ${match.proposedBy.level}`}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {match.clubName && (
            <div className="flex items-center gap-2" style={{ color: 'var(--color-t2)' }}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{match.clubName}</span>
            </div>
          )}
          {match.location && !match.clubName && (
            <div className="flex items-center gap-2" style={{ color: 'var(--color-t2)' }}>
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{match.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2" style={{ color: 'var(--color-t2)' }}>
            <Users className="w-4 h-4" />
            <span className="text-sm">
              Looking for {match.spotsNeeded} {match.spotsNeeded === 1 ? 'player' : 'players'}
            </span>
          </div>
        </div>

        {match.proposedTimes.length > 0 && (
          <div className="mb-4">
            <p
              className="text-xs font-medium mb-2 uppercase tracking-wide"
              style={{ color: 'var(--color-t3)' }}
            >
              Proposed Times
            </p>
            <div className="flex flex-wrap gap-2">
              {match.proposedTimes.slice(0, 3).map((time, i) => {
                const { date, time: timeStr } = formatTime(time);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                    style={{ background: 'rgba(255,255,255,0.6)' }}
                  >
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-t3)' }} />
                    <span style={{ color: 'var(--color-t1)' }}>{date}</span>
                    <Clock className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--color-t3)' }} />
                    <span style={{ color: 'var(--color-t1)' }}>{timeStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {match.message && (
          <p className="text-sm italic line-clamp-2 mb-4" style={{ color: 'var(--color-t2)' }}>
            "{match.message}"
          </p>
        )}

        <div className="mt-auto">
          <Button onClick={onJoin} disabled={joining} className="w-full">
            {joining ? 'Joining...' : 'Join This Match'}
          </Button>
        </div>
      </div>
    </div>
  );
}

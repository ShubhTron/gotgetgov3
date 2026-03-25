import { MapPin, Users, Star, Trophy, Calendar, Building2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SPORTS, type SportType } from '@/types';
import { getInitials } from '@/lib/avatar-utils';

export interface Club {
  id: string;
  name: string;
  city?: string;
  state?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  sports: SportType[];
  memberCount: number;
}

interface ClubCardProps {
  club: Club;
  isJoined?: boolean;
  onJoin?: () => void;
  joining?: boolean;
}

export function ClubCard({ club, isJoined, onJoin, joining }: ClubCardProps) {
  const imageUrl = club.logoUrl || club.coverImageUrl;

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--color-surf)',
        borderRadius: 12,
        border: '1px solid var(--color-bdr)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div
        className="h-36 flex items-center justify-center"
        style={{ background: 'var(--color-acc-bg)' }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-14 h-14" style={{ color: 'var(--color-acc)', opacity: 0.4 }} />
        )}
      </div>
      <div className="p-4">
        <h3
          className="text-base font-semibold mb-1 line-clamp-1"
          style={{ color: 'var(--color-t1)' }}
        >
          {club.name}
        </h3>
        {(club.city || club.state) && (
          <div
            className="flex items-center gap-1 text-sm mb-2"
            style={{ color: 'var(--color-t2)' }}
          >
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{[club.city, club.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {club.sports.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {club.sports.slice(0, 2).map((sport) => (
              <span
                key={sport}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'var(--color-surf-2)', color: 'var(--color-t2)' }}
              >
                {SPORTS[sport]?.name || sport}
              </span>
            ))}
            {club.sports.length > 2 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: 'var(--color-surf-2)', color: 'var(--color-t2)' }}
              >
                +{club.sports.length - 2}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-t3)' }}>
            <Users className="w-4 h-4" />
            <span>{club.memberCount} members</span>
          </div>
          {onJoin && (
            isJoined ? (
              <Button size="sm" variant="secondary" disabled className="gap-1">
                <Check className="w-3 h-3" />
                Joined
              </Button>
            ) : (
              <Button size="sm" onClick={onJoin} disabled={joining}>
                {joining ? 'Joining...' : 'Join'}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export interface Coach {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  sports: string[];
  bio?: string;
  hourlyRate?: number;
  certifications: string[];
}

interface CoachCardProps {
  coach: Coach;
  onBook?: () => void;
}

export function CoachCard({ coach, onBook }: CoachCardProps) {
  return (
    <div
      className="p-4"
      style={{
        background: 'var(--color-surf)',
        borderRadius: 12,
        border: '1px solid var(--color-bdr)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarImage src={coach.avatarUrl} />
          <AvatarFallback>{getInitials(coach.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate" style={{ color: 'var(--color-t1)' }}>
            {coach.name}
          </h3>
          <p className="text-sm truncate" style={{ color: 'var(--color-t2)' }}>
            {coach.sports.slice(0, 2).join(', ') || 'Multiple sports'}
          </p>
          {coach.hourlyRate && (
            <p className="text-sm font-medium" style={{ color: 'var(--color-acc)' }}>
              ${coach.hourlyRate}/hour
            </p>
          )}
        </div>
        {onBook && (
          <Button size="sm" variant="secondary" onClick={onBook}>
            Book
          </Button>
        )}
      </div>
      {coach.bio && (
        <p className="mt-3 text-sm line-clamp-2" style={{ color: 'var(--color-t2)' }}>{coach.bio}</p>
      )}
      {coach.certifications.length > 0 && (
        <div className="mt-3 flex items-center gap-1 text-sm" style={{ color: '#D97706' }}>
          <Star className="w-4 h-4" style={{ fill: '#FBBF24', color: '#FBBF24' }} />
          <span>{coach.certifications[0]}</span>
          {coach.certifications.length > 1 && (
            <span style={{ color: 'var(--color-t3)' }}>+{coach.certifications.length - 1} more</span>
          )}
        </div>
      )}
    </div>
  );
}

export interface Competition {
  id: string;
  name: string;
  type: string;
  sport: string;
  participants: number;
  status: 'active' | 'registration_open' | 'coming_soon';
  startDate?: string;
  location?: string;
}

interface CompetitionCardProps {
  competition: Competition;
  isJoined?: boolean;
  onJoin?: () => void;
  joining?: boolean;
}

export function CompetitionCard({ competition, isJoined, onJoin, joining }: CompetitionCardProps) {
  const statusColors: Record<string, string> = {
    active: 'var(--color-acc)',
    registration_open: 'var(--color-acc)',
    coming_soon: 'var(--color-t3)',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    registration_open: 'Registration Open',
    coming_soon: 'Coming Soon',
  };

  const canJoin = competition.status === 'registration_open' || competition.status === 'active';

  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: 12,
        border: '1px solid var(--color-bdr)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 112,
          background: 'linear-gradient(135deg, rgba(255,179,0,0.18) 0%, rgba(255,179,0,0.06) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Trophy style={{ width: 48, height: 48, color: '#FFB300', opacity: 0.4 }} />
      </div>

      <div style={{ padding: '12px 12px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-t1)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {competition.name}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--color-t2)',
                margin: '4px 0 0',
              }}
            >
              {competition.type} — {competition.sport}
            </p>
          </div>
          <Badge
            variant="default"
            style={{ background: statusColors[competition.status], flexShrink: 0 }}
          >
            {statusLabels[competition.status]}
          </Badge>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-t2)',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{competition.participants}</span>
          </div>
          {competition.startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{competition.startDate}</span>
            </div>
          )}
        </div>

        {competition.location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-t3)',
              marginBottom: onJoin ? 12 : 0,
              overflow: 'hidden',
            }}
          >
            <MapPin style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {competition.location}
            </span>
          </div>
        )}

        {canJoin && onJoin && (
          <div style={{ paddingTop: 12, borderTop: `1px solid var(--color-bdr)` }}>
            {isJoined ? (
              <Button variant="outline" size="sm" disabled style={{ width: '100%' }}>
                <Check style={{ width: 16, height: 16 }} />
                Joined
              </Button>
            ) : (
              <Button variant="default" size="sm" disabled={joining} onClick={onJoin} style={{ width: '100%' }}>
                {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {joining ? 'Joining...' : 'Join Competition'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  club: string;
  spots: string;
  sport?: string;
}

interface EventCardProps {
  event: Event;
  isJoined?: boolean;
  onJoin?: () => void;
  joining?: boolean;
}

export function EventCard({ event, isJoined, onJoin, joining }: EventCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surf)',
        borderRadius: 12,
        border: '1px solid var(--color-bdr)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 112,
          background: 'var(--color-acc-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Calendar style={{ width: 48, height: 48, color: 'var(--color-acc)', opacity: 0.4 }} />
      </div>

      <div style={{ padding: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-t1)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.name}
            </h3>
            {event.sport && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--color-t2)',
                  margin: '4px 0 0',
                }}
              >
                {event.sport}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--color-acc)',
                margin: 0,
              }}
            >
              {event.spots}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.75rem',
                color: 'var(--color-t3)',
                margin: 0,
              }}
            >
              spots
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-t2)',
            marginBottom: 8,
          }}
        >
          <Calendar style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span>{event.date} at {event.time}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-t3)',
            marginBottom: onJoin ? 12 : 0,
            overflow: 'hidden',
          }}
        >
          <MapPin style={{ width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.club}
          </span>
        </div>

        {onJoin && (
          <div style={{ paddingTop: 12, borderTop: `1px solid var(--color-bdr)` }}>
            {isJoined ? (
              <Button variant="outline" size="sm" disabled style={{ width: '100%' }}>
                <Check style={{ width: 16, height: 16 }} />
                Registered
              </Button>
            ) : (
              <Button variant="default" size="sm" disabled={joining} onClick={onJoin} style={{ width: '100%' }}>
                {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {joining ? 'Joining...' : 'Register'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function SwipeableClubCard({ club }: { club: Club }) {
  const imageUrl = club.logoUrl || club.coverImageUrl;

  return (
    <div
      className="h-full w-full rounded-2xl overflow-hidden shadow-xl select-none flex flex-col"
      style={{ background: 'var(--color-surf)' }}
    >
      <div
        className="h-48 flex items-center justify-center"
        style={{ background: 'var(--color-acc-bg)' }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <Building2 className="w-20 h-20" style={{ color: 'var(--color-acc)', opacity: 0.5 }} />
        )}
      </div>
      <div className="flex-1 p-6 flex flex-col">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit mb-3"
          style={{ background: 'var(--color-acc-bg)', color: 'var(--color-acc)' }}
        >
          <Building2 className="w-3 h-3" />
          Club
        </span>
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-t1)' }}>
          {club.name}
        </h3>
        {(club.city || club.state) && (
          <div className="flex items-center gap-1 text-base mb-3" style={{ color: 'var(--color-t2)' }}>
            <MapPin className="w-5 h-5 flex-shrink-0" />
            <span>{[club.city, club.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {club.sports.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {club.sports.map((sport) => (
              <span
                key={sport}
                className="px-3 py-1 rounded-full text-sm"
                style={{ background: 'var(--color-surf-2)', color: 'var(--color-t2)' }}
              >
                {SPORTS[sport]?.name || sport}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2" style={{ color: 'var(--color-t3)' }}>
          <Users className="w-5 h-5" />
          <span className="text-base">{club.memberCount} members</span>
        </div>
      </div>
    </div>
  );
}

export function SwipeableCompetitionCard({ competition }: { competition: Competition }) {
  const statusColors: Record<string, string> = {
    active: 'var(--color-acc)',
    registration_open: 'var(--color-acc)',
    coming_soon: 'var(--color-t3)',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    registration_open: 'Registration Open',
    coming_soon: 'Coming Soon',
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--color-surf)',
        borderRadius: 16,
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid var(--color-bdr)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          height: 192,
          background: 'linear-gradient(135deg, rgba(255,179,0,0.22) 0%, rgba(255,179,0,0.06) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Trophy style={{ width: 80, height: 80, color: '#FFB300', opacity: 0.45 }} />
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Badge variant="default" style={{ background: '#FFB300' }}>
            {competition.type}
          </Badge>
          <Badge variant="default" style={{ background: statusColors[competition.status] }}>
            {statusLabels[competition.status]}
          </Badge>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-t1)',
            margin: `0 0 8px`,
            lineHeight: 1.2,
          }}
        >
          {competition.name}
        </h3>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-t2)',
            margin: `0 0 12px`,
          }}
        >
          {competition.sport}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-t2)',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span>{competition.participants} players</span>
          </div>
          {competition.startDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span>{competition.startDate}</span>
            </div>
          )}
        </div>

        {competition.location && (
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-t3)',
            }}
          >
            <MapPin style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span>{competition.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SwipeableEventCard({ event }: { event: Event }) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--color-surf)',
        borderRadius: 16,
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid var(--color-bdr)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          height: 192,
          background: 'var(--color-acc-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Calendar style={{ width: 80, height: 80, color: 'var(--color-acc)', opacity: 0.45 }} />
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Badge variant="default" style={{ background: 'var(--color-acc)' }}>
            Event
          </Badge>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-t1)',
            margin: `0 0 8px`,
            lineHeight: 1.2,
          }}
        >
          {event.name}
        </h3>

        {event.sport && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--color-t2)',
              margin: `0 0 12px`,
            }}
          >
            {event.sport}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-t2)',
            marginBottom: 12,
          }}
        >
          <Calendar style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>{event.date} at {event.time}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-t3)',
            marginBottom: 12,
          }}
        >
          <MapPin style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span>{event.club}</span>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--color-acc)',
          }}
        >
          <Users style={{ width: 20, height: 20 }} />
          <span>{event.spots} spots</span>
        </div>
      </div>
    </div>
  );
}

export function SwipeableCoachCard({ coach }: { coach: Coach }) {
  return (
    <div
      className="h-full w-full rounded-2xl overflow-hidden shadow-xl select-none flex flex-col"
      style={{ background: 'var(--color-surf)' }}
    >
      <div className="h-48 flex items-center justify-center" style={{ background: 'var(--color-surf-2)' }}>
        {coach.avatarUrl ? (
          <img src={coach.avatarUrl} alt={coach.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-acc-bg)' }}
          >
            <span className="text-3xl font-bold" style={{ color: 'var(--color-acc)' }}>
              {coach.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1 p-6 flex flex-col">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit mb-3"
          style={{ background: 'var(--color-acc-bg)', color: 'var(--color-acc)' }}
        >
          <Star className="w-3 h-3" />
          Coach
        </span>
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-t1)' }}>
          {coach.name}
        </h3>
        {coach.sports.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {coach.sports.map((sport, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm"
                style={{ background: 'var(--color-surf-2)', color: 'var(--color-t2)' }}
              >
                {sport}
              </span>
            ))}
          </div>
        )}
        {coach.bio && (
          <p className="text-base mb-3 line-clamp-2" style={{ color: 'var(--color-t2)' }}>{coach.bio}</p>
        )}
        {coach.certifications.length > 0 && (
          <div className="flex items-center gap-1 mb-3" style={{ color: '#D97706' }}>
            <Star className="w-5 h-5" style={{ fill: '#FBBF24', color: '#FBBF24' }} />
            <span className="text-sm">{coach.certifications[0]}</span>
            {coach.certifications.length > 1 && (
              <span className="text-sm" style={{ color: 'var(--color-t3)' }}>+{coach.certifications.length - 1}</span>
            )}
          </div>
        )}
        {coach.hourlyRate && (
          <div className="mt-auto font-semibold text-lg" style={{ color: 'var(--color-acc)' }}>
            ${coach.hourlyRate}/hour
          </div>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--color-surf)' }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-t1)' }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs mb-4" style={{ color: 'var(--color-t2)' }}>
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

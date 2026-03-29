import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Clock, MapPin, Users, User,
  ChevronLeft, ChevronRight, Mail, Trash2, Trophy, X,
} from 'lucide-react';
import {
  format, addDays, addWeeks, startOfDay, startOfWeek, isSameDay, isToday as isDateToday,
} from 'date-fns';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { PlayerProfileModal } from '@/components/ui';
import { AvailabilityModal } from '@/components/availability';
import { InviteResponseModal } from '@/components/schedule';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { getInitials } from '@/lib/avatar-utils';

type ScheduleFilter = 'my' | 'all' | 'club';

interface ScheduleItem {
  id: string;
  type: 'match' | 'event' | 'coaching' | 'fixture' | 'competition';
  title: string;
  date: Date;
  time: string;
  location?: string;
  opponent?: { id?: string; name: string; avatarUrl?: string };
  participants?: number;
  maxParticipants?: number;
  status: 'confirmed' | 'pending' | 'tentative';
  category?: ScheduleFilter;
  sport?: string;
}

interface InvitedPlayer {
  id: string;
  swipeId: string;
  fullName: string;
  avatarUrl?: string;
  sport: SportType;
  level: string;
  createdAt: Date;
}

export function SchedulePage() {
  const navigate = useNavigate();
  const { scheduleFilter } = useFilters();
  const { user, isGuest, profile } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [invitedPlayers, setInvitedPlayers] = useState<InvitedPlayer[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedInvitePlayerId, setSelectedInvitePlayerId] = useState<string | null>(null);
  const [selectedInviteSwipeId, setSelectedInviteSwipeId] = useState<string | null>(null);

  const activeFilter = (scheduleFilter as ScheduleFilter) || 'my';

  useEffect(() => {
    if (user) {
      fetchInvitedPlayers();
      fetchJoinedItems();
    } else if (isGuest) {
      setLoadingSchedule(false);
    }
  }, [user, isGuest]);

  const fetchJoinedItems = async () => {
    if (!user) return;
    setLoadingSchedule(true);

    const [eventsRes, competitionsRes, challengesRes] = await Promise.all([
      supabase
        .from('event_registrations')
        .select(`
          event_id,
          registered_at,
          events (
            id,
            name,
            start_time,
            end_time,
            court_name,
            sport,
            clubs (name)
          )
        `)
        .eq('user_id', user.id),
      supabase
        .from('competition_entries')
        .select(`
          competition_id,
          registered_at,
          competitions (
            id,
            name,
            start_date,
            end_date,
            sport,
            competition_type,
            clubs (name)
          )
        `)
        .eq('user_id', user.id),
      supabase
        .from('challenge_players')
        .select(`
          challenge_id,
          response,
          challenges (
            id,
            sport,
            format,
            location,
            proposed_times,
            status,
            proposed_by,
            club_id,
            clubs (name),
            challenge_players (
              user_id,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .in('response', ['accepted', 'pending']),
    ]);

    const joinedItems: ScheduleItem[] = [];

    if (eventsRes.data) {
      (eventsRes.data as any[]).forEach((reg) => {
        const event = reg.events as unknown as {
          id: string; name: string; start_time: string; end_time?: string;
          court_name?: string; sport?: SportType; clubs?: { name: string };
        };
        if (!event) return;
        const startDate = new Date(event.start_time);
        joinedItems.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.name,
          date: startDate,
          time: format(startDate, 'h:mm a'),
          location: event.court_name || event.clubs?.name,
          status: 'confirmed',
          category: 'my',
          sport: event.sport ? SPORTS[event.sport]?.name : undefined,
        });
      });
    }

    if (competitionsRes.data) {
      (competitionsRes.data as any[]).forEach((entry) => {
        const comp = entry.competitions as unknown as {
          id: string; name: string; start_date?: string; end_date?: string;
          sport?: SportType; competition_type?: string; clubs?: { name: string };
        };
        if (!comp) return;
        const startDate = comp.start_date ? new Date(comp.start_date) : new Date();
        joinedItems.push({
          id: `comp-${comp.id}`,
          type: 'competition',
          title: comp.name,
          date: startDate,
          time: comp.start_date ? format(startDate, 'MMM d') : 'TBD',
          location: comp.clubs?.name,
          status: 'confirmed',
          category: 'my',
          sport: comp.sport ? SPORTS[comp.sport]?.name : undefined,
        });
      });
    }

    if (challengesRes.data) {
      (challengesRes.data as any[]).forEach((cp) => {
        const challenge = cp.challenges as unknown as {
          id: string; sport?: SportType; format?: string; location?: string;
          proposed_times?: string[]; status?: string; proposed_by?: string;
          club_id?: string; clubs?: { name: string };
          challenge_players?: Array<{
            user_id: string;
            profiles?: { id: string; full_name: string; avatar_url?: string };
          }>;
        };
        if (!challenge) return;
        const firstTime = challenge.proposed_times?.[0];
        if (!firstTime) return;
        const matchDate = new Date(firstTime);
        const matchTitle = challenge.format === 'singles' ? 'Singles Match' : 'Doubles Match';
        const opponent = challenge.challenge_players?.find(
          (player) => player.user_id !== user.id,
        )?.profiles;
        joinedItems.push({
          id: `challenge-${challenge.id}`,
          type: 'match',
          title: matchTitle,
          date: matchDate,
          time: format(matchDate, 'h:mm a'),
          location: challenge.location || challenge.clubs?.name,
          status: cp.response === 'accepted' ? 'confirmed' : 'pending',
          category: 'my',
          sport: challenge.sport ? SPORTS[challenge.sport]?.name : undefined,
          opponent: opponent
            ? { id: opponent.id, name: opponent.full_name, avatarUrl: opponent.avatar_url }
            : undefined,
        });
      });
    }

    setSchedule(joinedItems);
    setLoadingSchedule(false);
  };

  const fetchInvitedPlayers = async () => {
    if (!user) return;
    setLoadingInvites(true);
    const { data: swipes } = await supabase
      .from('swipe_matches')
      .select('id, target_user_id, sport, created_at')
      .eq('user_id', user.id)
      .eq('direction', 'right')
      .order('created_at', { ascending: false });

    if (!swipes || swipes.length === 0) {
      setInvitedPlayers([]);
      setLoadingInvites(false);
      return;
    }

    const targetUserIds = swipes.map((s) => s.target_user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', targetUserIds);
    const { data: sportProfiles } = await supabase
      .from('user_sport_profiles')
      .select('user_id, sport, self_assessed_level')
      .in('user_id', targetUserIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    const sportMap = new Map<string, { sport: SportType; level: string }>();
    sportProfiles?.forEach((sp) => {
      if (!sportMap.has(sp.user_id)) {
        sportMap.set(sp.user_id, { sport: sp.sport as SportType, level: sp.self_assessed_level || 'beginner' });
      }
    });

    const mapped: InvitedPlayer[] = swipes.map((swipe) => {
      const p = profileMap.get(swipe.target_user_id);
      const sportInfo = sportMap.get(swipe.target_user_id);
      return {
        id: swipe.target_user_id,
        swipeId: swipe.id,
        fullName: p?.full_name || 'Unknown Player',
        avatarUrl: p?.avatar_url || undefined,
        sport: (swipe.sport as SportType) || sportInfo?.sport || 'tennis',
        level: sportInfo?.level || 'beginner',
        createdAt: new Date(swipe.created_at),
      };
    });
    setInvitedPlayers(mapped);
    setLoadingInvites(false);
  };

  const handleRemoveInvite = async (swipeId: string) => {
    await supabase.from('swipe_matches').delete().eq('id', swipeId);
    setInvitedPlayers((prev) => prev.filter((p) => p.swipeId !== swipeId));
  };

  const handleCancelScheduleItem = async (itemId: string) => {
    if (itemId.startsWith('event-')) {
      await supabase.from('event_registrations').delete().eq('event_id', itemId.replace('event-', '')).eq('user_id', user!.id);
    } else if (itemId.startsWith('comp-')) {
      await supabase.from('competition_entries').delete().eq('competition_id', itemId.replace('comp-', '')).eq('user_id', user!.id);
    } else if (itemId.startsWith('challenge-')) {
      await supabase.from('challenge_players').delete().eq('challenge_id', itemId.replace('challenge-', '')).eq('user_id', user!.id);
    }
    setSchedule((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setPlayerModalOpen(true);
  };

  const handleInviteClick = (playerId: string, swipeId: string) => {
    setSelectedInvitePlayerId(playerId);
    setSelectedInviteSwipeId(swipeId);
    setInviteModalOpen(true);
  };

  const handleInviteAccept = async () => {
    await Promise.all([fetchInvitedPlayers(), fetchJoinedItems()]);
  };

  const handleInviteRefuse = async () => {
    await fetchInvitedPlayers();
  };

  const filteredSchedule = schedule
    .filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'my') return item.category === 'my';
      if (activeFilter === 'club') return item.category === 'club';
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // ── 2-week calendar grid (Sun-aligned) ────────────────────────────────────
  const periodStart = useMemo(() => {
    const today = startOfDay(new Date());
    const thisSunday = startOfWeek(today, { weekStartsOn: 0 });
    return addWeeks(thisSunday, weekOffset * 2);
  }, [weekOffset]);

  const twoWeekDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(periodStart, i)),
    [periodStart],
  );

  const rangeLabel = `${format(twoWeekDays[0], 'MMM d')} – ${format(twoWeekDays[13], 'MMM d, yyyy')}`;

  const selectedDaySchedule = useMemo(
    () => filteredSchedule.filter((item) => isSameDay(item.date, selectedDate)),
    [filteredSchedule, selectedDate],
  );


  const hasEventOnDay = (day: Date) =>
    filteredSchedule.some((item) => isSameDay(item.date, day));


  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)', paddingBottom: 148 }}>

      {/* ── Greeting ───────────────────────────────────────────────────────── */}
      <div style={{ padding: 'var(--space-5) var(--space-5) var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-t2)', marginBottom: 2 }}>
            Welcome back
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)',
            fontWeight: 800, color: 'var(--color-t1)', letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            Hi, {profile?.full_name?.split(' ')[0] ?? 'Athlete'}.
          </h1>
        </div>

        {/* Manage Availability icon */}
        <button
          onClick={() => setAvailabilityModalOpen(true)}
          title="Manage Availability"
          style={{
            width: 42, height: 42,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surf)',
            border: '1px solid var(--color-bdr)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <CalendarDays size={19} style={{ color: 'var(--color-acc)' }} />
        </button>
      </div>

      {/* ── 2-Week Calendar Grid ───────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
        <div style={{
          background: 'var(--color-surf)', borderRadius: 'var(--radius-xl)',
          padding: '16px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>
          {/* Header: prev / range label / next */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label="Previous 2 weeks"
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--color-bdr)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-t2)', flexShrink: 0 }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--color-t1)' }}>
              {rangeLabel}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label="Next 2 weeks"
              style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--color-bdr)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-t2)', flexShrink: 0 }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--color-t3)', letterSpacing: '0.04em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {twoWeekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const hasEvent = hasEventOnDay(day);
              const isToday = isDateToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  aria-label={format(day, 'EEEE, MMMM d')}
                  style={{
                    aspectRatio: '1', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: isSelected ? 'var(--color-acc)' : 'transparent',
                    position: 'relative', padding: 0, outline: 'none',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 14,
                    fontWeight: isToday || isSelected ? 700 : 400,
                    color: isSelected ? '#fff' : isToday ? 'var(--color-acc)' : 'var(--color-t1)',
                    lineHeight: 1,
                  }}>
                    {format(day, 'd')}
                  </span>
                  {hasEvent && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: isSelected ? '#fff' : 'var(--color-acc)',
                      position: 'absolute', bottom: 4,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* ── Today's Agenda ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
            color: 'var(--color-t2)',
          }}>
            {isDateToday(selectedDate) ? "Today's Agenda" : format(selectedDate, 'EEE, MMM d')}
          </span>
          {isDateToday(selectedDate) && selectedDaySchedule.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              background: 'var(--color-acc-bg)', color: 'var(--color-acc)',
              padding: '2px 10px', borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              border: '1px solid color-mix(in srgb, var(--color-acc) 25%, transparent)',
            }}>
              Active
            </span>
          )}
        </div>

        {loadingSchedule ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '2px solid var(--color-acc)', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
          </div>
        ) : selectedDaySchedule.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)',
          }}>
            <CalendarDays size={36} style={{ color: 'var(--color-t3)' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-t3)' }}>
              No events on this day
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {selectedDaySchedule.map((item) => (
              <SwipeableScheduleCard
                key={item.id}
                item={item}
                onCancel={() => handleCancelScheduleItem(item.id)}
                onPlayerClick={handlePlayerClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pending Invites ────────────────────────────────────────────────── */}
      {invitedPlayers.length > 0 && (
        <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
          }}>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'var(--color-t2)',
            }}>
              Pending Invites
            </span>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              background: 'var(--color-surf-2)', color: 'var(--color-t2)',
              padding: '1px 8px', borderRadius: 'var(--radius-full)',
            }}>
              {invitedPlayers.length}
            </span>
          </div>
          {loadingInvites ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '2px solid var(--color-acc)', borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {invitedPlayers.map((player) => (
                <SwipeableInvitedCard
                  key={player.swipeId}
                  player={player}
                  onRemove={() => handleRemoveInvite(player.swipeId)}
                  onClick={() => handleInviteClick(player.id, player.swipeId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AvailabilityModal
        isOpen={availabilityModalOpen}
        onClose={() => setAvailabilityModalOpen(false)}
      />
      <PlayerProfileModal
        open={playerModalOpen}
        onOpenChange={setPlayerModalOpen}
        playerId={selectedPlayerId}
        onChallenge={() => setPlayerModalOpen(false)}
        onMessage={() => setPlayerModalOpen(false)}
      />
      <InviteResponseModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        playerId={selectedInvitePlayerId}
        swipeId={selectedInviteSwipeId}
        onAccept={handleInviteAccept}
        onRefuse={handleInviteRefuse}
      />
    </div>
  );
}

// ─── Swipeable wrappers ───────────────────────────────────────────────────────

function SwipeableScheduleCard({ item, onCancel, onPlayerClick }: {
  item: ScheduleItem;
  onCancel: () => void;
  onPlayerClick: (playerId: string) => void;
}) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const bg = useTransform(x, [-150, 0], ['rgb(239 68 68)', 'var(--color-surf)']);
  const cancelOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) onCancel();
  };

  return (
    <div ref={constraintsRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
      <motion.div
        style={{ background: bg, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 24 }}
      >
        <motion.div style={{ opacity: cancelOpacity, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <X size={18} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>Cancel</span>
        </motion.div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, background: 'var(--color-surf)', position: 'relative' }}
      >
        <AgendaCard item={item} onPlayerClick={onPlayerClick} />
      </motion.div>
    </div>
  );
}

function SwipeableInvitedCard({ player, onRemove, onClick }: {
  player: InvitedPlayer;
  onRemove: () => void;
  onClick: () => void;
}) {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const bg = useTransform(x, [-150, 0], ['rgb(239 68 68)', 'var(--color-surf)']);
  const deleteOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) onRemove();
  };

  return (
    <div ref={constraintsRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
      <motion.div style={{ background: bg, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 24 }}>
        <motion.div style={{ opacity: deleteOpacity, display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
          <Trash2 size={18} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }}>Remove</span>
        </motion.div>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, background: 'var(--color-surf)', position: 'relative' }}
      >
        <InvitedPlayerCard player={player} onClick={onClick} />
      </motion.div>
    </div>
  );
}

// ─── Agenda card ──────────────────────────────────────────────────────────────

function AgendaCard({ item, onPlayerClick }: {
  item: ScheduleItem;
  onPlayerClick?: (playerId: string) => void;
}) {
  const typeLabels: Record<string, string> = {
    match: 'Match', event: 'Event', coaching: 'Coaching',
    fixture: 'League', competition: 'Competition',
  };

  return (
    <div style={{
      background: 'var(--color-surf)', borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)', display: 'flex', alignItems: 'stretch',
      gap: 'var(--space-3)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      {/* Date column */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minWidth: 40, gap: 2,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
          fontWeight: 800, color: 'var(--color-acc)', lineHeight: 1,
        }}>
          {item.date.getDate()}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
          color: 'var(--color-t3)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {format(item.date, 'EEE')}
        </span>
      </div>

      {/* Vertical divider */}
      <div style={{ width: 1, background: 'var(--color-bdr)', flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)',
          fontWeight: 700, color: 'var(--color-t1)', lineHeight: 1.2,
          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.title}
          {item.opponent && (
            <span style={{ fontWeight: 400, color: 'var(--color-t2)' }}>
              {' '}with{' '}
              {item.opponent.id && onPlayerClick ? (
                <button
                  onClick={() => onPlayerClick(item.opponent!.id!)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: 'inherit', color: 'var(--color-acc)', padding: 0,
                  }}
                >
                  {item.opponent.name}
                </button>
              ) : (
                item.opponent.name
              )}
            </span>
          )}
        </h3>

        {(item.location || item.time) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-t2)',
          }}>
            {item.location && <MapPin size={12} style={{ flexShrink: 0 }} />}
            {item.location && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location}</span>}
            {item.location && item.time && <span style={{ color: 'var(--color-t3)' }}>·</span>}
            {item.time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Clock size={12} />
                {item.time}
              </span>
            )}
          </div>
        )}

        {/* Participant row */}
        {item.opponent?.avatarUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', overflow: 'hidden',
              background: 'var(--color-surf-2)', flexShrink: 0,
            }}>
              <img src={item.opponent.avatarUrl} alt={item.opponent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)' }}>
              {item.opponent.name}
            </span>
          </div>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: 'color-mix(in srgb, var(--color-acc) 12%, transparent)',
            color: 'var(--color-acc)',
          }}>
            {typeLabels[item.type]}
          </span>
          {item.sport && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'var(--color-surf-2)', color: 'var(--color-t2)',
            }}>
              {item.sport}
            </span>
          )}
          {item.status === 'confirmed' && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'color-mix(in srgb, var(--color-acc) 12%, transparent)',
              color: 'var(--color-acc)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ✓ Confirmed
            </span>
          )}
          {item.status === 'pending' && (
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: 'color-mix(in srgb, #FFB300 12%, transparent)',
              color: '#FFB300',
            }}>
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Right chevron */}
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-t3)', flexShrink: 0 }}>
        <ChevronRight size={16} />
      </div>
    </div>
  );
}

// ─── Invited player card ──────────────────────────────────────────────────────

function InvitedPlayerCard({ player, onClick }: { player: InvitedPlayer; onClick: () => void }) {
  const sport = SPORTS[player.sport];
  const timeAgo = getTimeAgo(player.createdAt);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--color-surf)', borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)', display: 'flex', alignItems: 'center',
        gap: 'var(--space-3)', cursor: 'pointer',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: 'var(--color-surf-2)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
        color: 'var(--color-t2)',
      }}>
        {player.avatarUrl
          ? <img src={player.avatarUrl} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : getInitials(player.fullName)
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* RSVP badge */}
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'color-mix(in srgb, #FFB300 12%, transparent)', color: '#FFB300',
          padding: '1px 8px', borderRadius: 'var(--radius-full)',
          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
        }}>
          <Mail size={10} />
          RSVP Pending
        </span>
        <p style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)',
          color: 'var(--color-t1)', margin: '0 0 2px',
        }}>
          {player.fullName}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--color-t3)',
          margin: 0,
        }}>
          {sport?.name || player.sport} · <span style={{ textTransform: 'capitalize' }}>{player.level}</span> · {timeAgo}
        </p>
      </div>

      <ChevronRight size={16} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return format(date, 'MMM d');
}

// Unused but kept to avoid import errors if referenced elsewhere
export { addDays };

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useAuth } from '../../contexts/AuthContext';
import { useGuestTutorial } from '../../contexts/GuestTutorialContext';
import { supabase } from '../../lib/supabase';
import { haversineKm } from '../../lib/haversine';
import { eloMatchScore, getLevelElo } from '../../lib/elo';
import { FilterTriptych } from '../../components/layout/FilterTriptych';
import type { FilterTriptychHandle } from '../../components/layout/FilterTriptych';
import { InteractionBar } from '../../components/discover/InteractionBar';
import { SwipeDeck } from '../../components/discover/SwipeDeck';
import { EMMA_DISCOVER_PLAYER, EMMA_USER_ID } from '../../data/emmaDemoProfile';
import type { DiscoverPlayer, FilterSport, FilterSkill, MatchRecord } from '../../types/discover';
import type { SportType } from '../../types/index';

const SPORT_NAMES: Record<string, string> = {
  tennis: 'Tennis', padel: 'Padel', squash: 'Squash', platform_tennis: 'Platform Tennis',
};
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert', professional: 'Professional',
};

function computeScheduleOverlap(myAvail: string, theirAvail: string): string {
  if (myAvail === theirAvail || myAvail === 'flexible' || theirAvail === 'flexible') {
    return '2h overlap';
  }
  return 'Limited overlap';
}

function computeCompatibility(
  myLevel: string, theirLevel: string,
  distanceKm: number,
  myAvail: string, theirAvail: string,
  myUserId: string, theirUserId: string,
): number {
  const myElo    = getLevelElo(myLevel, myUserId);
  const theirElo = getLevelElo(theirLevel, theirUserId);
  const skillScore = eloMatchScore(myElo, theirElo);
  const distScore  = Math.max(0, 30 - distanceKm * 1.2);
  const schedScore = (myAvail === theirAvail) ? 20
    : (myAvail === 'flexible' || theirAvail === 'flexible') ? 10 : 0;
  return Math.min(97, Math.round(skillScore + distScore + schedScore));
}

function formatScore(score: { sets?: { team1: number; team2: number }[] } | null, myTeam: number): string {
  if (!score?.sets) return '';
  return score.sets.map(s =>
    myTeam === 1 ? `${s.team1}–${s.team2}` : `${s.team2}–${s.team1}`
  ).join('  ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TEN_MINUTES = 10 * 60 * 1000;

export function DiscoverPage() {
  const { user, profile, isGuest } = useAuth();
  const { tutorialStep, advanceTutorial, registerTarget, resetTutorial } = useGuestTutorial();
  const isDesktop = useIsDesktop();
  const deckRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<FilterTriptychHandle>(null);
  const [players, setPlayers] = useState<DiscoverPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [sport, setSport]     = useState<FilterSport>('tennis');
  const [distKm, setDistKm]   = useState(40);
  const [skill, setSkill]     = useState<FilterSkill>('any');

  // Swipe / favorites
  const [swipedIds, setSwipedIds]     = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [undoId, setUndoId]           = useState<string | null>(null);
  const [lastSwipe, setLastSwipe]     = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [triggerSwipe, setTriggerSwipe] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);

  // Match history cache
  const [matchCache, setMatchCache] = useState<Record<string, MatchRecord[]>>({});

  const fetchPlayers = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);

    const [profilesRes, sportProfilesRes, clubsRes, swipedRes] = await Promise.all([
      supabase.from('profiles')
        .select('id, full_name, avatar_url, location_lat, location_lng, last_seen')
        .neq('id', user.id),
      supabase.from('user_sport_profiles')
        .select('user_id, sport, self_assessed_level, play_style, preferred_time, availability'),
      supabase.from('user_clubs').select('user_id, clubs(name)'),
      supabase.from('swipe_matches')
        .select('target_user_id')
        .eq('user_id', user.id)
        .eq('sport', (sport === 'all' ? 'tennis' : sport) as any),
    ]);

    const profiles      = (profilesRes.data ?? []) as any[];
    const sportProfiles = (sportProfilesRes.data ?? []) as any[];
    const userClubs     = clubsRes.data ?? [];
    const swiped        = new Set((swipedRes.data ?? []).map((r: any) => r.target_user_id));
    setSwipedIds(swiped);

    // Build maps
    const spMap = new Map<string, any[]>();
    sportProfiles.forEach(sp => {
      if (!spMap.has(sp.user_id)) spMap.set(sp.user_id, []);
      spMap.get(sp.user_id)!.push(sp);
    });

    const clubMap = new Map<string, string>();
    userClubs.forEach((uc: any) => {
      if (uc.clubs?.name) clubMap.set(uc.user_id, uc.clubs.name);
    });

    // Current user sport profiles — already in the batch above, no extra query needed
    const mySpProfiles: any[] = sportProfiles.filter((sp: any) => sp.user_id === user.id);
    const mySpMap = new Map(mySpProfiles.map(sp => [sp.sport as string, sp]));

    // Current user location
    const myLat = (profile as any).location_lat ?? 25.2;
    const myLng = (profile as any).location_lng ?? 55.27;

    const result: DiscoverPlayer[] = [];

    for (const p of profiles) {
      const sps = spMap.get(p.id) ?? [];
      for (const sp of sps) {
        if (sport !== 'all' && sp.sport !== sport) continue;
        if (skill !== 'any' && sp.self_assessed_level !== skill) continue;

        const dist = haversineKm(myLat, myLng, p.location_lat ?? myLat, p.location_lng ?? myLng);
        if (dist > distKm) continue;
        if (swiped.has(p.id)) continue;

        const mySp = mySpMap.get(sp.sport) ?? mySpMap.values().next().value;
        const myLevel = mySp?.self_assessed_level ?? 'intermediate';
        const myAvail = mySp?.availability ?? 'flexible';

        const isActiveRecently = p.last_seen
          ? (Date.now() - new Date(p.last_seen).getTime()) < TEN_MINUTES
          : false;

        result.push({
          id: p.id,
          fullName: p.full_name,
          avatarUrl: p.avatar_url ?? undefined,
          sport: sp.sport as SportType,
          sportName: SPORT_NAMES[sp.sport] ?? sp.sport,
          level: sp.self_assessed_level,
          levelLabel: LEVEL_LABELS[sp.self_assessed_level] ?? sp.self_assessed_level,
          distanceKm: Math.round(dist * 10) / 10,
          lastSeen: p.last_seen ?? undefined,
          isActiveRecently,
          availability: sp.availability ?? 'flexible',
          preferredTime: sp.preferred_time ?? 'flexible',
          homeClub: clubMap.get(p.id) ?? '—',
          scheduleOverlapLabel: computeScheduleOverlap(myAvail, sp.availability ?? 'flexible'),
          playStyle: sp.play_style ?? undefined,
          compatibilityScore: computeCompatibility(
            myLevel, sp.self_assessed_level, dist, myAvail,
            sp.availability ?? 'flexible', user.id, p.id,
          ),
          recentMatches: [],
        });
      }
    }

    result.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    setPlayers(result);
    setLoading(false);
  }, [user, profile, sport, distKm, skill]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // Load favorites on mount
  useEffect(() => {
    if (!user) return;
    supabase.from('liked_players')
      .select('liked_user_id')
      .eq('liker_id', user.id)
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((r: any) => r.liked_user_id)));
      });
  }, [user]);

  // Lazy-load match history for top card
  useEffect(() => {
    if (players.length === 0) return;
    const topId = players.find(p => !swipedIds.has(p.id))?.id;
    if (!topId || matchCache[topId]) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.rpc as any)('get_player_recent_matches', { p_player_id: topId, p_limit: 5 })
      .then(({ data }: { data: unknown }) => {
        if (!data) return;
        const records: MatchRecord[] = (data as any[]).map((row: any) => ({
          id: row.id,
          result: row.my_team === row.winner_team ? 'W' : 'L',
          opponentName: row.opponent_name,
          score: formatScore(row.score, row.my_team),
          date: formatDate(row.played_at),
        }));
        setMatchCache(prev => ({ ...prev, [topId]: records }));
        setPlayers(prev => prev.map(p => p.id === topId ? { ...p, recentMatches: records } : p));
      });
  }, [players, swipedIds, matchCache]);

  const handleSwipeRight = useCallback(async (id: string) => {
    // Tutorial: intercept Emma's card swipe
    if (id === EMMA_USER_ID) {
      setSwipedIds(prev => new Set([...prev, id]));
      setLastSwipe({ id, direction: 'right' });
      setTriggerSwipe({ id, direction: 'right' });
      setTimeout(() => setTriggerSwipe(null), 400);
      advanceTutorial('go_to_notifications');
      return;
    }
    const player = players.find(p => p.id === id);
    if (!player || !user) return;
    setSwipedIds(prev => new Set([...prev, id]));
    setLastSwipe({ id, direction: 'right' });
    setTriggerSwipe({ id, direction: 'right' });
    setTimeout(() => setTriggerSwipe(null), 400);
    await (supabase.from('swipe_matches') as any).upsert({
      user_id: user.id, target_user_id: id, sport: player.sport, direction: 'right',
    }, { onConflict: 'user_id,target_user_id,sport' });
  }, [players, user, advanceTutorial]);

  const handleSwipeLeft = useCallback(async (id: string) => {
    const player = players.find(p => p.id === id);
    if (!player || !user) return;
    setSwipedIds(prev => new Set([...prev, id]));
    setLastSwipe({ id, direction: 'left' });
    setTriggerSwipe({ id, direction: 'left' });
    setTimeout(() => setTriggerSwipe(null), 400);
    await (supabase.from('swipe_matches') as any).upsert({
      user_id: user.id, target_user_id: id, sport: player.sport, direction: 'left',
    }, { onConflict: 'user_id,target_user_id,sport' });
  }, [players, user]);

  const handleUndo = useCallback(async () => {
    if (!lastSwipe || !user) return;
    const player = players.find(p => p.id === lastSwipe.id);
    if (!player) return;
    await supabase.from('swipe_matches')
      .delete()
      .eq('user_id', user.id)
      .eq('target_user_id', lastSwipe.id)
      .eq('sport', player.sport as any);
    setSwipedIds(prev => { const n = new Set(prev); n.delete(lastSwipe.id); return n; });
    setUndoId(lastSwipe.id);
    setTimeout(() => setUndoId(null), 100);
    setLastSwipe(null);
  }, [lastSwipe, user, players]);

  // Use a ref so handleFavorite always reads the latest favoriteIds without stale closure
  const favoriteIdsRef = useRef(favoriteIds);
  useEffect(() => { favoriteIdsRef.current = favoriteIds; }, [favoriteIds]);

  const handleFavorite = useCallback(async () => {
    const topPlayer = players.find(p => !swipedIds.has(p.id));
    if (!topPlayer || !user) return;
    const id = topPlayer.id;
    const currentFavIds = favoriteIdsRef.current;
    if (currentFavIds.has(id)) {
      // Optimistic remove
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      const { error } = await (supabase.from('liked_players') as any)
        .delete()
        .eq('liker_id', user.id)
        .eq('liked_user_id', id)
        .eq('sport', topPlayer.sport);
      if (error) {
        console.error('Failed to unlike player:', error);
        setFavoriteIds(prev => new Set([...prev, id])); // rollback
      }
    } else {
      // Optimistic add
      setFavoriteIds(prev => new Set([...prev, id]));
      const { error } = await (supabase.from('liked_players') as any)
        .upsert(
          { liker_id: user.id, liked_user_id: id, sport: topPlayer.sport },
          { onConflict: 'liker_id,liked_user_id,sport' },
        );
      if (error) {
        console.error('Failed to like player:', error);
        setFavoriteIds(prev => { const n = new Set(prev); n.delete(id); return n; }); // rollback
      }
    }
  }, [players, swipedIds, user]);

  // Register deck container as spotlight target for swipe_card step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tutorialStep === 'swipe_card') {
      registerTarget('swipe_card', deckRef.current);
    }
    return () => {
      if (tutorialStep === 'swipe_card') registerTarget('swipe_card', null);
    };
  }, [tutorialStep]);

  // Build display list: prepend Emma in tutorial mode
  const displayPlayers: DiscoverPlayer[] =
    (isGuest && tutorialStep === 'swipe_card')
      ? [EMMA_DISCOVER_PLAYER, ...players.filter(p => p.id !== EMMA_USER_ID)]
      : players;

  const unswiped = displayPlayers.filter(p => !swipedIds.has(p.id));
  const topPlayer = unswiped[0] ?? null;

  // Shuffle: pick a random unswiped player (weighted by compatibility) and move to front
  const handleShuffle = useCallback(() => {
    if (unswiped.length <= 1) return;
    // Exclude current top, pick randomly from the rest weighted by compatibilityScore
    const pool = unswiped.slice(1);
    const totalScore = pool.reduce((s, p) => s + p.compatibilityScore, 0);
    let rand = Math.random() * totalScore;
    let picked = pool[pool.length - 1];
    for (const p of pool) {
      rand -= p.compatibilityScore;
      if (rand <= 0) { picked = p; break; }
    }
    setPlayers(prev => {
      const without = prev.filter(p => p.id !== picked.id);
      const insertAt = without.findIndex(p => !swipedIds.has(p.id));
      const next = [...without];
      next.splice(insertAt === -1 ? 0 : insertAt, 0, picked);
      return next;
    });
  }, [unswiped, swipedIds]);

  if (!user && !isGuest) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)',
        gap: 'var(--space-4)',
      }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-t1)', textAlign: 'center' }}>
          Sign in to discover players
        </div>
      </div>
    );
  }

  if (!isGuest && loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-t2)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <>
      <FilterTriptych
        ref={filterRef}
        sport={sport} distanceKm={distKm} skill={skill}
        onSportChange={setSport}
        onDistanceChange={setDistKm}
        onSkillChange={setSkill}
      />

      {isDesktop ? (
        /* ── Desktop: two-panel (full width) ── */
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          minHeight: 0,
          width: '100%',
        }}>
          {/* Left: swipe deck + interaction bar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--color-bdr)',
            padding: '16px 20px',
            overflow: 'hidden',
          }}>
            <div ref={deckRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <SwipeDeck
                players={displayPlayers}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                undoId={undoId}
                triggerSwipe={triggerSwipe}
                onReset={isGuest ? resetTutorial : undefined}
              />
            </div>
            <InteractionBar
              inline
              onPass={() => topPlayer && handleSwipeLeft(topPlayer.id)}
              onConnect={() => topPlayer && handleSwipeRight(topPlayer.id)}
              onShuffle={handleShuffle}
              onFavorite={handleFavorite}
              isFavorited={!!topPlayer && favoriteIds.has(topPlayer.id)}
              disabled={!topPlayer}
            />
          </div>

          {/* Right: player details */}
          <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
            {topPlayer ? (
              <DesktopPlayerPanel player={topPlayer} />
            ) : (
              <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                color: 'var(--color-t3)',
              }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500 }}>No more players nearby</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)' }}>Adjust your filters to see more</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Mobile: original layout ── */
        <>
          <div ref={deckRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 480, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <SwipeDeck
                players={displayPlayers}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                undoId={undoId}
                triggerSwipe={triggerSwipe}
                onReset={isGuest ? resetTutorial : undefined}
              />
            </div>
          </div>
          <InteractionBar
            onPass={() => topPlayer && handleSwipeLeft(topPlayer.id)}
            onConnect={() => topPlayer && handleSwipeRight(topPlayer.id)}
            onShuffle={handleShuffle}
            onFavorite={handleFavorite}
            isFavorited={!!topPlayer && favoriteIds.has(topPlayer.id)}
            disabled={!topPlayer}
          />
        </>
      )}
    </>
  );
}

function DesktopPlayerPanel({ player }: { player: DiscoverPlayer }) {
  const LEVEL_LABELS: Record<string, string> = {
    beginner: 'Beginner', intermediate: 'Intermediate',
    advanced: 'Advanced', expert: 'Expert', professional: 'Professional',
  };

  const initials = player.fullName
    ? player.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header: avatar + name + score ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Avatar */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
          background: player.avatarUrl ? 'transparent' : 'var(--color-acc-bg)',
          border: '2px solid var(--color-bdr)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              color: 'var(--color-acc)',
            }}>{initials}</span>
          )}
        </div>

        {/* Name + sport pill */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            fontWeight: 800, color: 'var(--color-t1)', margin: 0, lineHeight: 1.2,
          }}>
            {player.fullName}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 999,
              background: 'var(--color-acc-bg)', color: 'var(--color-acc)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11,
              textTransform: 'uppercase' as const, letterSpacing: '0.06em',
            }}>
              {player.sportName}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)',
            }}>
              {LEVEL_LABELS[player.level] ?? player.level}
            </span>
            {player.isActiveRecently && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-acc)', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-acc)' }}>Active now</span>
              </span>
            )}
          </div>
        </div>

        {/* Compatibility badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'var(--color-acc-bg)', borderRadius: 14,
          padding: '10px 16px', flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 24,
            fontWeight: 800, color: 'var(--color-acc)', lineHeight: 1,
          }}>
            {player.compatibilityScore}%
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--color-acc)',
            fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            marginTop: 3, opacity: 0.8,
          }}>
            Match
          </span>
        </div>
      </div>

      {/* ── Compatibility bar ── */}
      <div>
        <div style={{ height: 4, borderRadius: 999, background: 'var(--color-surf-2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            width: `${player.compatibilityScore}%`,
            background: `linear-gradient(90deg, var(--color-acc) 0%, var(--color-acc-dk) 100%)`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* ── Play style tags ── */}
      {player.playStyle && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {player.playStyle.split(',').map((s: string) => (
            <span key={s} style={{
              padding: '4px 12px', borderRadius: 999,
              background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
              fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)',
            }}>
              {s.trim()}
            </span>
          ))}
        </div>
      )}

      {/* ── Stats grid ── */}
      <div style={{
        background: 'var(--color-surf)',
        borderRadius: 14, padding: '16px 20px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px',
      }}>
        {([
          ['Availability', player.availability],
          ['Preferred time', player.preferredTime],
          ['Home club', player.homeClub],
          ['Schedule overlap', player.scheduleOverlapLabel],
        ] as const).map(([label, value]) => (
          <div key={label}>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--color-t3)',
              marginBottom: 3,
            }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-t1)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Match history ── */}
      <div>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--color-t3)',
          marginBottom: 10,
        }}>
          Last 5 Matches
        </div>
        {player.recentMatches && player.recentMatches.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {player.recentMatches.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center',
                padding: '8px 12px', borderRadius: 10,
                background: 'var(--color-surf)',
                border: '1px solid var(--color-bdr)',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: m.result === 'W' ? 'rgba(22,212,106,0.12)' : 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 11,
                  color: m.result === 'W' ? 'var(--color-acc)' : 'var(--color-red)',
                  flexShrink: 0,
                }}>{m.result}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t1)', flex: 1, marginLeft: 10 }}>
                  vs {m.opponentName}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', fontVariantNumeric: 'tabular-nums' }}>
                  {m.score}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t3)', margin: 0 }}>
              Recently joined — no match history yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

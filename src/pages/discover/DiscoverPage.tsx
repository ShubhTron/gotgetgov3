import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { haversineKm } from '../../lib/haversine';
import { eloMatchScore, getLevelElo } from '../../lib/elo';
import { FilterTriptych } from '../../components/layout/FilterTriptych';
import { InteractionBar } from '../../components/discover/InteractionBar';
import { SwipeDeck } from '../../components/discover/SwipeDeck';
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
  const { user, profile } = useAuth();
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
        .eq('sport', sport === 'all' ? 'tennis' : sport),
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
    supabase.from('favorites')
      .select('target_user_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setFavoriteIds(new Set(data.map((r: any) => r.target_user_id)));
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
    const player = players.find(p => p.id === id);
    if (!player || !user) return;
    setSwipedIds(prev => new Set([...prev, id]));
    setLastSwipe({ id, direction: 'right' });
    setTriggerSwipe({ id, direction: 'right' });
    setTimeout(() => setTriggerSwipe(null), 400);
    await (supabase.from('swipe_matches') as any).upsert({
      user_id: user.id, target_user_id: id, sport: player.sport, direction: 'right',
    }, { onConflict: 'user_id,target_user_id,sport' });
  }, [players, user]);

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
      .eq('sport', player.sport);
    setSwipedIds(prev => { const n = new Set(prev); n.delete(lastSwipe.id); return n; });
    setUndoId(lastSwipe.id);
    setTimeout(() => setUndoId(null), 100);
    setLastSwipe(null);
  }, [lastSwipe, user, players]);

  const handleFavorite = useCallback(async () => {
    const topPlayer = players.find(p => !swipedIds.has(p.id));
    if (!topPlayer || !user) return;
    const id = topPlayer.id;
    if (favoriteIds.has(id)) {
      setFavoriteIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      await supabase.from('favorites')
        .delete().eq('user_id', user.id).eq('target_user_id', id).eq('sport', topPlayer.sport);
    } else {
      setFavoriteIds(prev => new Set([...prev, id]));
      await (supabase.from('favorites') as any)
        .insert({ user_id: user.id, target_user_id: id, sport: topPlayer.sport });
    }
  }, [players, swipedIds, favoriteIds, user]);

  const topPlayer = players.find(p => !swipedIds.has(p.id));

  if (!user) {
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

  if (loading) {
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
        sport={sport} distanceKm={distKm} skill={skill}
        onSportChange={setSport}
        onDistanceChange={setDistKm}
        onSkillChange={setSkill}
      />

      <SwipeDeck
        players={players}
        onSwipeRight={handleSwipeRight}
        onSwipeLeft={handleSwipeLeft}
        undoId={undoId}
        triggerSwipe={triggerSwipe}
      />

      <InteractionBar
        onPass={() => topPlayer && handleSwipeLeft(topPlayer.id)}
        onConnect={() => topPlayer && handleSwipeRight(topPlayer.id)}
        onUndo={handleUndo}
        onFavorite={handleFavorite}
        canUndo={!!lastSwipe}
        isFavorited={!!topPlayer && favoriteIds.has(topPlayer.id)}
        disabled={!topPlayer}
      />
    </>
  );
}

import { supabase } from './supabase';
import type { SportType } from '../types/database';
import type {
  MatchResult,
  PendingScoreMatch,
  SubmitMatchResultPayload,
  ScoringError,
  SportScoringConfig,
} from '../types';

// ---------------------------------------------------------------------------
// SPORT_SCORING config (moved from ScoreMatchModal.tsx)
// ---------------------------------------------------------------------------

export const SPORT_SCORING: Record<string, SportScoringConfig> = {
  tennis: { type: 'sets', defaultSets: 3, maxPoints: 7, winByTwo: true, label: 'Games' },
  platform_tennis: { type: 'sets', defaultSets: 3, maxPoints: 7, winByTwo: true, label: 'Games' },
  padel: { type: 'sets', defaultSets: 3, maxPoints: 7, winByTwo: true, label: 'Games' },
  squash: { type: 'games', defaultSets: 5, maxPoints: 11, winByTwo: true, label: 'Points' },
  pickleball: { type: 'games', defaultSets: 3, maxPoints: 11, winByTwo: true, label: 'Points' },
  badminton: { type: 'games', defaultSets: 3, maxPoints: 21, winByTwo: true, label: 'Points' },
  table_tennis: { type: 'games', defaultSets: 5, maxPoints: 11, winByTwo: true, label: 'Points' },
  racquetball_squash57: { type: 'games', defaultSets: 5, maxPoints: 15, winByTwo: false, label: 'Points' },
  beach_tennis: { type: 'sets', defaultSets: 2, maxPoints: 6, winByTwo: true, label: 'Games' },
  real_tennis: { type: 'sets', defaultSets: 3, maxPoints: 6, winByTwo: true, label: 'Games' },
  golf: { type: 'points', defaultSets: 1, maxPoints: 18, winByTwo: false, label: 'Holes' },
};

// ---------------------------------------------------------------------------
// fetchPendingScoreMatches
// ---------------------------------------------------------------------------

export async function fetchPendingScoreMatches(
  userId: string
): Promise<{ data: PendingScoreMatch[] | null; error: ScoringError | null }> {
  try {
    // Query challenges where user is a player, score_status = 'score_pending',
    // and no linked match_result exists yet.
    const { data, error } = await (supabase as any)
      .from('challenges')
      .select(`
        id,
        sport,
        format,
        confirmed_time,
        score_status,
        challenge_players!inner (
          user_id,
          team_number
        )
      `)
      .eq('score_status', 'score_pending')
      .eq('challenge_players.user_id', userId);

    if (error) {
      return { data: null, error: { message: error.message, code: error.code } };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Filter out challenges that already have a match_result
    const challengeIds = data.map((c) => c.id);
    const { data: existingResults, error: resultsError } = await supabase
      .from('match_results')
      .select('challenge_id')
      .in('challenge_id', challengeIds);

    if (resultsError) {
      return { data: null, error: { message: resultsError.message, code: resultsError.code } };
    }

    const scoredChallengeIds = new Set(
      (existingResults || []).map((r) => r.challenge_id).filter(Boolean)
    );

    const pendingChallenges = data.filter((c) => !scoredChallengeIds.has(c.id));

    if (pendingChallenges.length === 0) {
      return { data: [], error: null };
    }

    // Fetch opponent info for each challenge
    const results: PendingScoreMatch[] = [];

    for (const challenge of pendingChallenges) {
      // Get all players for this challenge
      const { data: players, error: playersError } = await supabase
        .from('challenge_players')
        .select(`
          user_id,
          team_number,
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('challenge_id', challenge.id);

      if (playersError) {
        continue;
      }

      const otherPlayers = (players || []).filter((p) => p.user_id !== userId);
      const myTeam = (players || []).find((p) => p.user_id === userId)?.team_number ?? 1;

      const opponents = otherPlayers.filter((p) => p.team_number !== myTeam);
      const partners = otherPlayers.filter((p) => p.team_number === myTeam);

      const firstOpponent = opponents[0];
      if (!firstOpponent) continue;

      const opponentProfile = firstOpponent.profiles as unknown as {
        id: string;
        full_name: string;
        avatar_url: string | null;
      };

      const pending: PendingScoreMatch = {
        challengeId: challenge.id,
        sport: challenge.sport as SportType,
        format: (challenge.format as 'singles' | 'doubles') || 'singles',
        confirmedTime: challenge.confirmed_time || new Date().toISOString(),
        opponent: {
          id: opponentProfile.id,
          name: opponentProfile.full_name,
          avatarUrl: opponentProfile.avatar_url || undefined,
        },
      };

      if (partners[0]) {
        const partnerProfile = partners[0].profiles as unknown as {
          id: string;
          full_name: string;
          avatar_url: string | null;
        };
        pending.partner = {
          id: partnerProfile.id,
          name: partnerProfile.full_name,
          avatarUrl: partnerProfile.avatar_url || undefined,
        };
      }

      if (opponents[1]) {
        const opp2Profile = opponents[1].profiles as unknown as {
          id: string;
          full_name: string;
          avatar_url: string | null;
        };
        pending.opponent2 = {
          id: opp2Profile.id,
          name: opp2Profile.full_name,
          avatarUrl: opp2Profile.avatar_url || undefined,
        };
      }

      results.push(pending);
    }

    return { data: results, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { message } };
  }
}

// ---------------------------------------------------------------------------
// fetchMatchResults
// ---------------------------------------------------------------------------

export async function fetchMatchResults(
  userId: string,
  sport?: SportType
): Promise<{ data: MatchResult[] | null; error: ScoringError | null }> {
  try {
    // Get result IDs where user is a player
    const { data: playerRows, error: playerError } = await supabase
      .from('match_result_players')
      .select('result_id')
      .eq('user_id', userId);

    if (playerError) {
      return { data: null, error: { message: playerError.message, code: playerError.code } };
    }

    if (!playerRows || playerRows.length === 0) {
      return { data: [], error: null };
    }

    const resultIds = playerRows.map((r) => r.result_id);

    let query = supabase
      .from('match_results')
      .select(`
        id,
        challenge_id,
        sport,
        format,
        played_at,
        score,
        winner_team,
        submitted_by,
        status,
        disputed_by,
        created_at
      `)
      .in('id', resultIds)
      .order('played_at', { ascending: false });

    if (sport) {
      query = query.eq('sport', sport);
    }

    const { data: results, error: resultsError } = await query;

    if (resultsError) {
      return { data: null, error: { message: resultsError.message, code: resultsError.code } };
    }

    if (!results || results.length === 0) {
      return { data: [], error: null };
    }

    // Fetch players for all results
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from('match_result_players')
      .select(`
        result_id,
        user_id,
        team_number,
        profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('result_id', results.map((r) => r.id));

    if (allPlayersError) {
      return { data: null, error: { message: allPlayersError.message, code: allPlayersError.code } };
    }

    const playersByResult = new Map<string, typeof allPlayers>();
    for (const p of allPlayers || []) {
      if (!playersByResult.has(p.result_id)) {
        playersByResult.set(p.result_id, []);
      }
      playersByResult.get(p.result_id)!.push(p);
    }

    const mapped: MatchResult[] = results.map((r) => {
      const players = playersByResult.get(r.id) || [];
      return {
        id: r.id,
        challengeId: r.challenge_id || undefined,
        sport: r.sport as SportType,
        format: (r.format as 'singles' | 'doubles') || 'singles',
        playedAt: r.played_at,
        score: r.score as { sets: { team1: number; team2: number }[]; formatted: string },
        winnerTeam: (r.winner_team as 1 | 2 | null) ?? null,
        submittedBy: r.submitted_by,
        status: r.status as 'pending' | 'confirmed' | 'disputed',
        players: players.map((p) => {
          const profile = p.profiles as unknown as {
            id: string;
            full_name: string;
            avatar_url: string | null;
          };
          return {
            userId: p.user_id,
            teamNumber: p.team_number as 1 | 2,
            name: profile.full_name,
            avatarUrl: profile.avatar_url || undefined,
          };
        }),
      };
    });

    return { data: mapped, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { message } };
  }
}

// ---------------------------------------------------------------------------
// fetchPendingConfirmations
// ---------------------------------------------------------------------------

export async function fetchPendingConfirmations(
  userId: string
): Promise<{ data: MatchResult[] | null; error: ScoringError | null }> {
  try {
    // Get result IDs where user is a player
    const { data: playerRows, error: playerError } = await supabase
      .from('match_result_players')
      .select('result_id')
      .eq('user_id', userId);

    if (playerError) {
      return { data: null, error: { message: playerError.message, code: playerError.code } };
    }

    if (!playerRows || playerRows.length === 0) {
      return { data: [], error: null };
    }

    const resultIds = playerRows.map((r) => r.result_id);

    const { data: results, error: resultsError } = await supabase
      .from('match_results')
      .select(`
        id,
        challenge_id,
        sport,
        format,
        played_at,
        score,
        winner_team,
        submitted_by,
        status,
        disputed_by,
        created_at
      `)
      .in('id', resultIds)
      .eq('status', 'pending')
      .neq('submitted_by', userId);

    if (resultsError) {
      return { data: null, error: { message: resultsError.message, code: resultsError.code } };
    }

    if (!results || results.length === 0) {
      return { data: [], error: null };
    }

    // Fetch players for all results
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from('match_result_players')
      .select(`
        result_id,
        user_id,
        team_number,
        profiles!inner (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('result_id', results.map((r) => r.id));

    if (allPlayersError) {
      return { data: null, error: { message: allPlayersError.message, code: allPlayersError.code } };
    }

    const playersByResult = new Map<string, typeof allPlayers>();
    for (const p of allPlayers || []) {
      if (!playersByResult.has(p.result_id)) {
        playersByResult.set(p.result_id, []);
      }
      playersByResult.get(p.result_id)!.push(p);
    }

    const mapped: MatchResult[] = results.map((r) => {
      const players = playersByResult.get(r.id) || [];
      return {
        id: r.id,
        challengeId: r.challenge_id || undefined,
        sport: r.sport as SportType,
        format: (r.format as 'singles' | 'doubles') || 'singles',
        playedAt: r.played_at,
        score: r.score as { sets: { team1: number; team2: number }[]; formatted: string },
        winnerTeam: (r.winner_team as 1 | 2 | null) ?? null,
        submittedBy: r.submitted_by,
        status: r.status as 'pending' | 'confirmed' | 'disputed',
        players: players.map((p) => {
          const profile = p.profiles as unknown as {
            id: string;
            full_name: string;
            avatar_url: string | null;
          };
          return {
            userId: p.user_id,
            teamNumber: p.team_number as 1 | 2,
            name: profile.full_name,
            avatarUrl: profile.avatar_url || undefined,
          };
        }),
      };
    });

    return { data: mapped, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { message } };
  }
}

// ---------------------------------------------------------------------------
// submitMatchResult
// ---------------------------------------------------------------------------

export async function submitMatchResult(
  payload: SubmitMatchResultPayload & { submittedBy: string }
): Promise<{ data: { id: string } | null; error: ScoringError | null }> {
  try {
    // Validate score.formatted is not empty/whitespace
    if (!payload.score.formatted || !payload.score.formatted.trim()) {
      return {
        data: null,
        error: { message: 'Score description cannot be empty', code: 'EMPTY_SCORE' },
      };
    }

    // 1. Insert match_results row
    const { data: result, error: resultError } = await supabase
      .from('match_results')
      .insert({
        challenge_id: payload.challengeId || null,
        sport: payload.sport,
        format: payload.format,
        played_at: payload.playedAt,
        score: payload.score,
        winner_team: payload.winnerTeam,
        submitted_by: payload.submittedBy,
        status: 'pending',
      })
      .select('id')
      .single();

    if (resultError || !result) {
      return {
        data: null,
        error: { message: resultError?.message || 'Failed to insert match result', code: resultError?.code },
      };
    }

    // 2. Insert match_result_players rows
    const playerRows = payload.players.map((p) => ({
      result_id: result.id,
      user_id: p.userId,
      team_number: p.teamNumber,
    }));

    const { error: playersError } = await supabase
      .from('match_result_players')
      .insert(playerRows);

    if (playersError) {
      // Clean up the orphaned result row
      await supabase.from('match_results').delete().eq('id', result.id);
      return {
        data: null,
        error: { message: playersError.message, code: playersError.code },
      };
    }

    // 3. If challengeId provided, update challenge score_status = 'scored'
    if (payload.challengeId) {
      const { error: challengeError } = await supabase
        .from('challenges')
        .update({ score_status: 'scored' } as Record<string, unknown>)
        .eq('id', payload.challengeId);

      if (challengeError) {
        console.error('[submitMatchResult] Failed to update challenge score_status:', challengeError);
        // Non-fatal — result is already saved
      }
    }

    // 4. Fetch submitter's name for notifications
    const { data: submitterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', payload.submittedBy)
      .single();

    const submitterName = submitterProfile?.full_name || 'Someone';

    // 5. Insert score_confirmation_request notification for each opponent
    const opponentPlayers = payload.players.filter((p) => p.userId !== payload.submittedBy);

    for (const opponent of opponentPlayers) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: opponent.userId,
        type: 'score_confirmation_request',
        title: 'Score confirmation requested',
        body: `A score has been submitted for your ${payload.sport} match. Please confirm or dispute.`,
        data: {
          resultId: result.id,
          sport: payload.sport,
          submittedBy: payload.submittedBy,
          submitterName: submitterName,
        },
        read: false,
      });

      if (notifError) {
        console.error('[submitMatchResult] Failed to insert notification:', notifError);
        // Non-fatal
      }
    }

    return { data: { id: result.id }, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: { message } };
  }
}

// ---------------------------------------------------------------------------
// confirmResult
// ---------------------------------------------------------------------------

export async function confirmResult(
  resultId: string
): Promise<{ error: ScoringError | null }> {
  try {
    // 1. Update match_results.status = 'confirmed'
    const { data: result, error: updateError } = await supabase
      .from('match_results')
      .update({ status: 'confirmed' })
      .eq('id', resultId)
      .select('submitted_by, sport')
      .single();

    if (updateError) {
      return { error: { message: updateError.message, code: updateError.code } };
    }

    // 2. Insert notification for submitter
    if (result?.submitted_by) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: result.submitted_by,
        type: 'match_result',
        title: 'Score confirmed',
        body: `Your submitted score for the ${result.sport} match has been confirmed.`,
        data: { resultId },
        read: false,
      });

      if (notifError) {
        console.error('[confirmResult] Failed to insert notification:', notifError);
        // Non-fatal
      }
    }

    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: { message } };
  }
}

// ---------------------------------------------------------------------------
// disputeResult
// ---------------------------------------------------------------------------

export async function disputeResult(
  resultId: string,
  userId: string
): Promise<{ error: ScoringError | null }> {
  try {
    // 1. Update match_results.status = 'disputed', disputed_by = userId
    const { data: result, error: updateError } = await supabase
      .from('match_results')
      .update({ status: 'disputed', disputed_by: userId })
      .eq('id', resultId)
      .select('submitted_by, sport')
      .single();

    if (updateError) {
      return { error: { message: updateError.message, code: updateError.code } };
    }

    // 2. Insert score_disputed notification for submitter
    if (result?.submitted_by) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: result.submitted_by,
        type: 'score_disputed',
        title: 'Score disputed',
        body: `Your submitted score for the ${result.sport} match has been disputed.`,
        data: { resultId, disputedBy: userId },
        read: false,
      });

      if (notifError) {
        console.error('[disputeResult] Failed to insert notification:', notifError);
        // Non-fatal
      }
    }

    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: { message } };
  }
}

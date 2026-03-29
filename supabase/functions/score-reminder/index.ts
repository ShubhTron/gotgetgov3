// Feature: match-scoring-system
// Edge Function: score-reminder
// Invoked by Supabase cron (every hour).
// Queries challenges past due and not yet scored, sets score_status = 'score_pending',
// and inserts score_reminder notifications for each player (deduplicated).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (_req: Request): Promise<Response> => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // 1. Find challenges that are:
    //    - status = 'accepted'
    //    - score_status = 'not_played'
    //    - confirmed_time < NOW() - INTERVAL '24 hours'
    //    - no linked match_result row exists
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select('id, sport, confirmed_time')
      .eq('status', 'accepted')
      .eq('score_status', 'not_played')
      .lt('confirmed_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (challengesError) {
      console.error('[score-reminder] Failed to query challenges:', challengesError);
      return new Response(
        JSON.stringify({ error: challengesError.message, processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!challenges || challenges.length === 0) {
      console.log('[score-reminder] No eligible challenges found.');
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const challengeIds = challenges.map((c) => c.id);

    // 2. Filter out challenges that already have a linked match_result
    const { data: existingResults, error: resultsError } = await supabase
      .from('match_results')
      .select('challenge_id')
      .in('challenge_id', challengeIds);

    if (resultsError) {
      console.error('[score-reminder] Failed to query match_results:', resultsError);
      return new Response(
        JSON.stringify({ error: resultsError.message, processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const scoredIds = new Set(
      (existingResults ?? []).map((r) => r.challenge_id).filter(Boolean)
    );

    const eligibleChallenges = challenges.filter((c) => !scoredIds.has(c.id));

    if (eligibleChallenges.length === 0) {
      console.log('[score-reminder] All candidates already have match results.');
      return new Response(
        JSON.stringify({ processed: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;

    for (const challenge of eligibleChallenges) {
      try {
        // 3. Update score_status = 'score_pending'
        const { error: updateError } = await supabase
          .from('challenges')
          .update({ score_status: 'score_pending' })
          .eq('id', challenge.id);

        if (updateError) {
          console.error(
            `[score-reminder] Failed to update score_status for challenge ${challenge.id}:`,
            updateError
          );
          continue;
        }

        // 4. Get all players for this challenge
        const { data: players, error: playersError } = await supabase
          .from('challenge_players')
          .select(`
            user_id,
            profiles!inner (
              id,
              full_name
            )
          `)
          .eq('challenge_id', challenge.id);

        if (playersError) {
          console.error(
            `[score-reminder] Failed to fetch players for challenge ${challenge.id}:`,
            playersError
          );
          continue;
        }

        if (!players || players.length === 0) {
          console.warn(`[score-reminder] No players found for challenge ${challenge.id}`);
          continue;
        }

        // 5. Check for existing score_reminder notifications for this challenge
        //    to avoid duplicates (Requirement 5.5)
        const playerUserIds = players.map((p) => p.user_id);

        const { data: existingNotifs, error: notifsQueryError } = await supabase
          .from('notifications')
          .select('user_id, data')
          .eq('type', 'score_reminder')
          .in('user_id', playerUserIds);

        if (notifsQueryError) {
          console.error(
            `[score-reminder] Failed to query existing notifications for challenge ${challenge.id}:`,
            notifsQueryError
          );
          // Non-fatal: continue but skip notification insertion to be safe
          processed++;
          continue;
        }

        // Build a set of user_ids that already have a score_reminder for this challenge
        const alreadyNotified = new Set<string>(
          (existingNotifs ?? [])
            .filter((n) => {
              const data = n.data as Record<string, unknown> | null;
              return data?.challengeId === challenge.id;
            })
            .map((n) => n.user_id)
        );

        // 6. Insert score_reminder notification for each player not yet notified
        for (const player of players) {
          if (alreadyNotified.has(player.user_id)) {
            console.log(
              `[score-reminder] Skipping duplicate notification for user ${player.user_id} / challenge ${challenge.id}`
            );
            continue;
          }

          // Find the opponent name (first other player)
          const profile = player.profiles as unknown as { id: string; full_name: string };
          const opponent = players.find((p) => p.user_id !== player.user_id);
          const opponentProfile = opponent?.profiles as unknown as
            | { id: string; full_name: string }
            | undefined;

          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: player.user_id,
            type: 'score_reminder',
            title: 'Add your match score',
            body: opponentProfile
              ? `You played a match with ${opponentProfile.full_name} yesterday. Add the score?`
              : 'You have a match that needs a score. Add it now?',
            data: {
              challengeId: challenge.id,
              opponentName: opponentProfile?.full_name ?? null,
              sport: challenge.sport,
            },
            read: false,
          });

          if (notifError) {
            console.error(
              `[score-reminder] Failed to insert notification for user ${player.user_id}:`,
              notifError
            );
            // Non-fatal: log and continue
          }

          // Suppress unused variable warning
          void profile;
        }

        processed++;
      } catch (challengeErr) {
        console.error(
          `[score-reminder] Unexpected error processing challenge ${challenge.id}:`,
          challengeErr
        );
        // Continue to next challenge — never throw
      }
    }

    console.log(`[score-reminder] Done. Processed ${processed} challenge(s).`);
    return new Response(
      JSON.stringify({ processed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    // Top-level catch — log and return cleanly, never throw
    console.error('[score-reminder] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: String(err), processed: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

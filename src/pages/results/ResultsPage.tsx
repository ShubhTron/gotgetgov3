import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import { SPORTS } from '@/types';
import type { MatchResult, PendingScoreMatch, SportType } from '@/types';
import { ScoreMatchModal } from '@/components/results';
import { fetchMatchResults, fetchPendingScoreMatches, fetchPendingConfirmations, confirmResult, disputeResult } from '@/lib/scoring';
import { supabase } from '@/lib/supabase';
import { getInitials } from '@/lib/avatar-utils';
import {
  sampleLadderStandings as mockLadderStandings,
  sampleLeagueStandings as mockLeagueStandings,
  sampleTournaments as mockTournaments,
} from '@/data/mock';

// Sport filter pill — "all" means no filter
type SportFilter = SportType | 'all';

type ResultsFilter = 'my' | 'club' | 'all';
type SubFilter = 'matches' | 'ladders' | 'leagues' | 'tournaments';

interface LadderStanding {
  id: string;
  position: number;
  previousPosition: number;
  player: { name: string; avatarUrl?: string };
  matchesPlayed: number;
  matchesWon: number;
  ladderName: string;
}

const sampleLadderStandings: LadderStanding[] = mockLadderStandings as LadderStanding[];

/* ─── tiny helpers ─────────────────────────────────────────────────────── */

function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl?: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', background: 'var(--color-surf-2)',
      border: '2px solid var(--color-bdr)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.35, fontWeight: 700, color: 'var(--color-t2)' }}>
            {getInitials(name)}
          </span>
      }
    </div>
  );
}

function Chip({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em',
      background: bg, color,
    }}>
      {label}
    </span>
  );
}

/* ─── main page ────────────────────────────────────────────────────────── */

export function ResultsPage() {
  const { resultsFilter, resultsSubFilter } = useFilters();
  const { user } = useAuth();
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [preselectedMatch, setPreselectedMatch] = useState<PendingScoreMatch | undefined>();

  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [pendingScoreMatches, setPendingScoreMatches] = useState<PendingScoreMatch[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);

  const activeFilter = (resultsFilter as ResultsFilter) || 'my';
  const activeSubFilter = (resultsSubFilter as SubFilter) || 'matches';

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_sport_profiles')
      .select('sport')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          const sports = [...new Set(data.map((r: { sport: string }) => r.sport as SportType))];
          setUserSports(sports);
        }
      });
  }, [user]);

  const loadData = async (sport?: SportType) => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const [resultsRes, pendingRes, confirmationsRes] = await Promise.all([
      fetchMatchResults(user.id, sport),
      fetchPendingScoreMatches(user.id),
      fetchPendingConfirmations(user.id),
    ]);

    if (resultsRes.error) {
      setError(resultsRes.error.message);
    } else {
      setMatchResults(resultsRes.data || []);
    }

    setPendingScoreMatches(pendingRes.data || []);
    setPendingConfirmations(confirmationsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sportFilter]);

  const handleMatchScored = () => {
    setShowScoreModal(false);
    setPreselectedMatch(undefined);
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
  };

  const handleConfirm = async (resultId: string) => {
    setConfirmingId(resultId);
    await confirmResult(resultId);
    setConfirmingId(null);
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
  };

  const handleDispute = async (resultId: string) => {
    if (!user) return;
    setDisputingId(resultId);
    await disputeResult(resultId, user.id);
    setDisputingId(null);
    loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType));
  };

  const confirmedResults = matchResults.filter((m) => m.status === 'confirmed');
  const wins = confirmedResults.filter((m) => {
    const myPlayer = m.players.find((p) => p.userId === user?.id);
    return myPlayer && m.winnerTeam === myPlayer.teamNumber;
  }).length;
  const stats = {
    matchesPlayed: confirmedResults.length,
    wins,
    winRate: confirmedResults.length > 0 ? `${Math.round((wins / confirmedResults.length) * 100)}%` : '0%',
  };

  return (
    <div style={{ paddingBottom: 24, paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>

      {/* ── Score Match button ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <button
          onClick={() => setShowScoreModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-acc)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius-full)',
            padding: '10px 20px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 'var(--text-sm)', letterSpacing: '0.04em',
            boxShadow: '0 4px 16px rgba(22,212,106,0.3)',
          }}
        >
          <PlusCircle size={18} />
          Score Match
        </button>
      </div>

      <ScoreMatchModal
        open={showScoreModal}
        onOpenChange={(open) => {
          setShowScoreModal(open);
          if (!open) setPreselectedMatch(undefined);
        }}
        onScored={handleMatchScored}
        preselectedMatch={preselectedMatch}
      />

      {activeFilter === 'my' && activeSubFilter === 'matches' && (
        <div>
          {/* ── Sport filter pills ─────────────────────────────────────── */}
          {userSports.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--color-t3)', margin: '0 0 8px',
              }}>
                Sport
              </p>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as never, paddingBottom: 2 }}>
                {(['all', ...userSports] as SportFilter[]).map((sp) => {
                  const active = sportFilter === sp;
                  return (
                    <button
                      key={sp}
                      onClick={() => setSportFilter(sp)}
                      style={{
                        padding: '7px 18px',
                        borderRadius: 'var(--radius-full)',
                        border: active ? 'none' : '1px solid var(--color-bdr)',
                        background: active ? 'var(--color-acc)' : 'var(--color-surf)',
                        color: active ? '#fff' : 'var(--color-t2)',
                        fontFamily: 'var(--font-body)', fontWeight: 600,
                        fontSize: 13, cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sp === 'all' ? 'All' : SPORTS[sp]?.name || sp}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
              <Loader2 size={28} style={{ color: 'var(--color-acc)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
              <AlertCircle size={28} style={{ color: 'var(--color-red)' }} />
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t2)', margin: 0 }}>{error}</p>
              <button
                onClick={() => loadData(sportFilter === 'all' ? undefined : (sportFilter as SportType))}
                style={{
                  padding: '8px 20px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-bdr)', background: 'var(--color-surf)',
                  color: 'var(--color-t1)', fontFamily: 'var(--font-body)', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* ── Needs Score ──────────────────────────────────────── */}
              {pendingScoreMatches.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 20, color: 'var(--color-t1)', marginBottom: 10, marginTop: 0,
                  }}>
                    Needs Score
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingScoreMatches.map((match) => (
                      <button
                        key={match.challengeId}
                        onClick={() => { setPreselectedMatch(match); setShowScoreModal(true); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 'var(--radius-xl)',
                          border: '1px solid rgba(255,179,0,0.35)',
                          background: 'rgba(255,179,0,0.06)',
                          textAlign: 'left', cursor: 'pointer', width: '100%',
                        }}
                      >
                        <Avatar name={match.opponent.name} avatarUrl={match.opponent.avatarUrl} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', margin: 0, fontSize: 14 }}>
                            vs {match.opponent.name}
                          </p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '2px 0 0' }}>
                            {SPORTS[match.sport]?.name || match.sport} · {formatDate(match.confirmedTime)}
                          </p>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Pending Confirmation ─────────────────────────────── */}
              {pendingConfirmations.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: 20, color: 'var(--color-t1)', marginBottom: 10, marginTop: 0,
                  }}>
                    Pending Confirmation
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingConfirmations.map((result) => {
                      const submitter = result.players.find((p) => p.userId === result.submittedBy);
                      return (
                        <div
                          key={result.id}
                          style={{
                            padding: '14px 16px', borderRadius: 'var(--radius-xl)',
                            background: 'var(--color-surf)',
                            border: '1px solid var(--color-bdr)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar name={submitter?.name || 'Player'} avatarUrl={submitter?.avatarUrl} size={36} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', margin: 0, fontSize: 14 }}>
                                {submitter?.name || 'Opponent'} submitted a score
                              </p>
                              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '2px 0 0' }}>
                                {SPORTS[result.sport]?.name || result.sport} · {result.score.formatted} · {formatDate(result.playedAt)}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              disabled={confirmingId === result.id || disputingId === result.id}
                              onClick={() => handleConfirm(result.id)}
                              style={{
                                flex: 1, height: 38, borderRadius: 10,
                                border: '1px solid #FFB300', background: 'rgba(255,179,0,0.08)',
                                color: '#FFB300', fontFamily: 'var(--font-body)', fontWeight: 700,
                                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                opacity: confirmingId === result.id ? 0.6 : 1,
                              }}
                            >
                              {confirmingId === result.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Confirm'}
                            </button>
                            <button
                              disabled={confirmingId === result.id || disputingId === result.id}
                              onClick={() => handleDispute(result.id)}
                              style={{
                                flex: 1, height: 38, borderRadius: 10,
                                border: '1px solid var(--color-red)', background: 'rgba(255,59,48,0.08)',
                                color: 'var(--color-red)', fontFamily: 'var(--font-body)', fontWeight: 700,
                                fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                opacity: disputingId === result.id ? 0.6 : 1,
                              }}
                            >
                              {disputingId === result.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Dispute'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Stats ─────────────────────────────────────────────── */}
              <StatsOverview stats={stats} />

              {/* ── History title ─────────────────────────────────────── */}
              <h2 style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
                color: 'var(--color-t1)', textAlign: 'center',
                margin: '28px 0 14px',
              }}>
                My Match History
              </h2>

              {matchResults.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-t2)', padding: '40px 0', fontFamily: 'var(--font-body)' }}>
                  No match results yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matchResults.map((match) => (
                    <MatchCard key={match.id} match={match} currentUserId={user?.id} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Ladder Standings ──────────────────────────────────────────────── */}
      {activeSubFilter === 'ladders' && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 14 }}>
            Ladder Standings
          </h2>
          <div style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            {sampleLadderStandings.map((standing) => (
              <LadderRow key={standing.id} standing={standing} isCurrentUser={standing.player.name === 'Me'} />
            ))}
          </div>
        </div>
      )}

      {activeSubFilter === 'leagues' && <LeagueStandings />}
      {activeSubFilter === 'tournaments' && <TournamentResults />}
    </div>
  );
}

/* ─── StatsOverview ────────────────────────────────────────────────────── */

interface StatsData { matchesPlayed: number; wins: number; winRate: string; }

function StatsOverview({ stats }: { stats: StatsData }) {
  const items = [
    { label: 'Matches Played', value: stats.matchesPlayed },
    { label: 'Wins', value: stats.wins },
    { label: 'Win Rate', value: stats.winRate },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          style={{
            background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
            borderRadius: 'var(--radius-xl)', padding: '14px 10px', textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--color-t1)', margin: 0 }}>
            {value}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '4px 0 0' }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ─── MatchCard ────────────────────────────────────────────────────────── */

function MatchCard({ match, currentUserId }: { match: MatchResult; currentUserId?: string }) {
  const sport = SPORTS[match.sport as keyof typeof SPORTS];
  const myPlayer = match.players.find((p) => p.userId === currentUserId);
  const won = myPlayer ? match.winnerTeam === myPlayer.teamNumber : false;
  const opponent = match.players.find((p) => p.userId !== currentUserId);

  const isWin = match.status === 'confirmed' && won;
  const isLoss = match.status === 'confirmed' && !won;
  const isPending = match.status === 'pending';
  const isDisputed = match.status === 'disputed';

  const iconBg = isPending ? 'rgba(255,179,0,0.15)' : isDisputed ? 'rgba(255,59,48,0.15)' : isWin ? 'rgba(22,212,106,0.15)' : 'rgba(255,59,48,0.15)';
  const iconColor = isPending ? '#FFB300' : isDisputed ? 'var(--color-red)' : isWin ? 'var(--color-acc)' : 'var(--color-red)';

  let chipLabel = '';
  let chipColor = '';
  let chipBg = '';
  if (isPending) { chipLabel = 'Awaiting'; chipColor = '#FFB300'; chipBg = 'rgba(255,179,0,0.15)'; }
  else if (isDisputed) { chipLabel = 'Disputed'; chipColor = 'var(--color-red)'; chipBg = 'rgba(255,59,48,0.15)'; }
  else if (isWin) { chipLabel = 'Win'; chipColor = 'var(--color-acc)'; chipBg = 'var(--color-acc-bg)'; }
  else if (isLoss) { chipLabel = 'Loss'; chipColor = 'var(--color-red)'; chipBg = 'rgba(255,59,48,0.12)'; }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 'var(--radius-xl)',
      background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
    }}>
      {/* Status icon */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: iconBg,
      }}>
        {isPending
          ? <span style={{ fontSize: 16, fontWeight: 800, color: iconColor }}>?</span>
          : isDisputed
          ? <span style={{ fontSize: 14, fontWeight: 800, color: iconColor }}>D</span>
          : isWin
          ? <Trophy size={22} style={{ color: iconColor }} />
          : <span style={{ fontSize: 20, fontWeight: 800, color: iconColor }}>L</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {chipLabel && <Chip label={chipLabel} color={chipColor} bg={chipBg} />}
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)' }}>
            {sport?.name || match.sport}
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--color-t1)', margin: '0 0 3px' }}>
          vs {opponent?.name || 'Opponent'}
        </p>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)' }}>
          {match.score.formatted}
        </span>
      </div>

      {/* Date */}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t3)', flexShrink: 0, margin: 0 }}>
        {formatDate(match.playedAt)}
      </p>
    </div>
  );
}

/* ─── LadderRow ────────────────────────────────────────────────────────── */

function LadderRow({ standing, isCurrentUser }: { standing: LadderStanding; isCurrentUser: boolean }) {
  const positionChange = standing.previousPosition - standing.position;

  const positionColor =
    standing.position === 1 ? '#FFB300' :
    standing.position === 2 ? 'var(--color-t2)' :
    standing.position === 3 ? '#CD7F32' :
    'var(--color-t3)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      borderBottom: '1px solid var(--color-bdr)',
      background: isCurrentUser ? 'var(--color-acc-bg)' : 'transparent',
    }}>
      <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: positionColor }}>
          {standing.position}
        </span>
      </div>

      <div style={{ width: 22, flexShrink: 0 }}>
        {positionChange > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-acc)' }}>
            <TrendingUp size={14} />
            <span style={{ fontSize: 11 }}>{positionChange}</span>
          </div>
        )}
        {positionChange < 0 && (
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-red)' }}>
            <TrendingDown size={14} />
            <span style={{ fontSize: 11 }}>{Math.abs(positionChange)}</span>
          </div>
        )}
        {positionChange === 0 && <Minus size={14} style={{ color: 'var(--color-t3)' }} />}
      </div>

      <Avatar name={standing.player.name} avatarUrl={standing.player.avatarUrl} size={34} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: isCurrentUser ? 'var(--color-acc)' : 'var(--color-t1)', margin: 0 }}>
          {standing.player.name}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '2px 0 0' }}>
          {standing.matchesWon}W – {standing.matchesPlayed - standing.matchesWon}L
        </p>
      </div>

      <ChevronRight size={18} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
    </div>
  );
}

/* ─── LeagueStandings ──────────────────────────────────────────────────── */

function LeagueStandings() {
  const standings = mockLeagueStandings;
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 14 }}>
        League Standings
      </h2>
      <div style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surf-2)' }}>
                {['#', 'Team', 'P', 'W', 'D', 'L', 'Pts'].map((header, i) => (
                  <th key={header} style={{
                    padding: '10px 12px', textAlign: i <= 1 ? 'left' : 'center',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11,
                    letterSpacing: '0.06em', color: 'var(--color-t3)',
                    borderBottom: '1px solid var(--color-bdr)',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.position} style={{ borderTop: '1px solid var(--color-bdr)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', fontSize: 13 }}>{row.position}</td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', color: 'var(--color-t1)', fontSize: 13 }}>{row.team}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.played}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.won}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.drawn}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', color: 'var(--color-t2)', fontSize: 13 }}>{row.lost}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--color-t1)', fontSize: 13 }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── TournamentResults ────────────────────────────────────────────────── */

function TournamentResults() {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-t1)', textAlign: 'center', marginBottom: 14 }}>
        Tournament Results
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mockTournaments.map((tournament) => (
          <div
            key={tournament.id}
            style={{
              padding: '16px', borderRadius: 'var(--radius-xl)',
              background: 'var(--color-surf)', border: '1px solid var(--color-bdr)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--color-t1)', margin: 0 }}>
                {tournament.name}
              </h3>
              <Chip
                label={tournament.status}
                color={tournament.status === 'Completed' ? 'var(--color-acc)' : '#FFB300'}
                bg={tournament.status === 'Completed' ? 'var(--color-acc-bg)' : 'rgba(255,179,0,0.12)'}
              />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)', margin: '0 0 6px' }}>
              {tournament.format}
            </p>
            {tournament.winner && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={16} style={{ color: '#FFB300' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--color-t1)' }}>
                  Winner: {tournament.winner}
                </span>
              </div>
            )}
            {tournament.nextRound && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-t2)', margin: '4px 0 0' }}>
                {tournament.nextRound}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

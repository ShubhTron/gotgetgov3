import { useState, useEffect } from 'react';
import { Plus, Minus, ChevronRight, X } from 'lucide-react';
import { getInitials } from '@/lib/avatar-utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { SPORTS, type SportType, type PendingScoreMatch } from '@/types';
import { formatDate } from '@/lib/utils';
import { SPORT_SCORING, fetchPendingScoreMatches, submitMatchResult } from '@/lib/scoring';

interface ScoreMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScored: () => void;
  preselectedMatch?: PendingScoreMatch;
}

interface SetScore { team1: number; team2: number; }
interface Connection { id: string; name: string; avatarUrl?: string; }
type Step = 0 | 1 | 2 | 3;

/* ─── shared primitives ────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '1px solid var(--color-bdr)',
  background: 'var(--color-surf-2)',
  color: 'var(--color-t1)',
  fontFamily: 'var(--font-body)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
  appearance: 'none', WebkitAppearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-body)',
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--color-t3)',
  marginBottom: 6,
};

function PrimaryBtn({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', height: 50, borderRadius: 'var(--radius-full)',
        background: disabled ? 'var(--color-surf-2)' : 'var(--color-acc)',
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--color-t3)' : '#fff',
        fontFamily: 'var(--font-body)', fontWeight: 700,
        fontSize: 14, letterSpacing: '0.04em',
        boxShadow: disabled ? 'none' : '0 4px 16px rgba(22,212,106,0.25)',
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: 46, borderRadius: 'var(--radius-full)',
        background: 'var(--color-surf-2)',
        border: '1px solid var(--color-bdr)',
        cursor: 'pointer', color: 'var(--color-t2)',
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

function MiniAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden', background: 'var(--color-surf-2)',
      border: '1.5px solid var(--color-bdr)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-t2)', fontFamily: 'var(--font-body)' }}>
            {getInitials(name)}
          </span>
      }
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────────────── */

export function ScoreMatchModal({ open, onOpenChange, onScored, preselectedMatch }: ScoreMatchModalProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(0);
  const [pendingMatches, setPendingMatches] = useState<PendingScoreMatch[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const [sport, setSport] = useState<SportType>('tennis');
  const [format, setFormat] = useState<'singles' | 'doubles'>('singles');
  const [opponent, setOpponent] = useState<Connection | null>(null);
  const [partner, setPartner] = useState<Connection | null>(null);
  const [opponent2, setOpponent2] = useState<Connection | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);

  const [sets, setSets] = useState<SetScore[]>([{ team1: 0, team2: 0 }]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activePendingMatch, setActivePendingMatch] = useState<PendingScoreMatch | null>(null);

  const scoring = SPORT_SCORING[sport] || SPORT_SCORING.tennis;

  useEffect(() => {
    if (!open || !user) return;
    if (preselectedMatch) {
      applyPendingMatch(preselectedMatch);
      setStep(2);
      return;
    }
    setPendingLoading(true);
    fetchPendingScoreMatches(user.id).then(({ data }) => {
      const matches = data || [];
      setPendingMatches(matches);
      setPendingLoading(false);
      setStep(matches.length === 0 ? 1 : 0);
    });
    fetchConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  useEffect(() => { if (!open) resetForm(); }, [open]);
  useEffect(() => { setSets([{ team1: 0, team2: 0 }]); }, [sport]);

  function applyPendingMatch(match: PendingScoreMatch) {
    setActivePendingMatch(match);
    setSport(match.sport);
    setFormat(match.format);
    setOpponent({ id: match.opponent.id, name: match.opponent.name, avatarUrl: match.opponent.avatarUrl });
    if (match.partner) setPartner({ id: match.partner.id, name: match.partner.name, avatarUrl: match.partner.avatarUrl });
    if (match.opponent2) setOpponent2({ id: match.opponent2.id, name: match.opponent2.name, avatarUrl: match.opponent2.avatarUrl });
    setSets([{ team1: 0, team2: 0 }]);
  }

  const fetchConnections = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('connections')
      .select('id,connected_user_id,user_id,connected:connected_user_id (id, full_name, avatar_url)')
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
      .eq('status', 'accepted') as unknown as { data: { id: string; connected_user_id: string; user_id: string; connected: { id: string; full_name: string; avatar_url: string | null } | null }[] | null };
    if (data) {
      const mapped: Connection[] = data.map((conn) => {
        const profile = conn.connected;
        const isMe = conn.connected_user_id === user.id;
        if (isMe) return { id: conn.user_id, name: 'Other User', avatarUrl: undefined };
        return { id: profile?.id || conn.connected_user_id, name: profile?.full_name || 'Player', avatarUrl: profile?.avatar_url || undefined };
      });
      setConnections(mapped.filter((c, i, arr) => i === arr.findIndex((x) => x.id === c.id)));
    }
  };

  const handleScoreChange = (setIndex: number, team: 'team1' | 'team2', delta: number) => {
    const newSets = [...sets];
    newSets[setIndex][team] = Math.max(0, Math.min(newSets[setIndex][team] + delta, scoring.maxPoints + 5));
    setSets(newSets);
  };

  const formatScore = () => sets.map((s) => `${s.team1}-${s.team2}`).join(', ');

  const calculateWinner = (): 1 | 2 | null => {
    let t1 = 0, t2 = 0;
    sets.forEach((s) => { if (s.team1 > s.team2) t1++; else if (s.team2 > s.team1) t2++; });
    const needed = Math.ceil(scoring.defaultSets / 2);
    return t1 >= needed ? 1 : t2 >= needed ? 2 : null;
  };

  const handleSubmit = async () => {
    if (!user || !opponent) return;
    setSubmitLoading(true);
    setSubmitError(null);
    const players: { userId: string; teamNumber: 1 | 2 }[] = [
      { userId: user.id, teamNumber: 1 },
      { userId: opponent.id, teamNumber: 2 },
    ];
    if (format === 'doubles') {
      if (partner) players.push({ userId: partner.id, teamNumber: 1 });
      if (opponent2) players.push({ userId: opponent2.id, teamNumber: 2 });
    }
    const { error } = await submitMatchResult({
      challengeId: activePendingMatch?.challengeId,
      sport, format, playedAt: new Date().toISOString(),
      score: { sets, formatted: formatScore() },
      winnerTeam: calculateWinner(), players, submittedBy: user.id,
    });
    setSubmitLoading(false);
    if (error) { setSubmitError(error.message); return; }
    onScored();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSport('tennis'); setFormat('singles'); setOpponent(null); setPartner(null);
    setOpponent2(null); setSets([{ team1: 0, team2: 0 }]); setStep(0);
    setActivePendingMatch(null); setSubmitError(null); setPendingMatches([]);
  };

  const sportOptions = Object.entries(SPORTS).map(([key, value]) => ({ value: key, label: value.name }));

  const stepTitles: Record<Step, string> = { 0: 'Needs Score', 1: 'Match Details', 2: 'Enter Score', 3: 'Review & Submit' };

  if (!open) return null;

  return (
    /* ── Overlay ────────────────────────────────────────────────────────── */
    <div
      onClick={() => onOpenChange(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
    >
      {/* ── Sheet ───────────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', background: 'var(--color-surf)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 16px',
          borderBottom: '1px solid var(--color-bdr)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 18, color: 'var(--color-t1)', margin: 0,
          }}>
            {stepTitles[step]}
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-t2)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 20px 0', flex: 1 }}>

          {/* ── Step 0: Pending list ───────────────────────────────────── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pendingLoading ? (
                <p style={{ textAlign: 'center', color: 'var(--color-t2)', fontFamily: 'var(--font-body)', padding: '24px 0' }}>
                  Loading pending matches…
                </p>
              ) : (
                <>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-t2)', margin: 0 }}>
                    These matches are waiting for a score.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingMatches.map((match) => (
                      <button
                        key={match.challengeId}
                        onClick={() => { applyPendingMatch(match); setStep(2); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', borderRadius: 14,
                          border: '1px solid var(--color-bdr)',
                          background: 'var(--color-surf-2)',
                          textAlign: 'left', cursor: 'pointer', width: '100%',
                        }}
                      >
                        <MiniAvatar name={match.opponent.name} avatarUrl={match.opponent.avatarUrl} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--color-t1)', margin: 0 }}>
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
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      width: '100%', height: 44, borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-bdr)', background: 'var(--color-surf-2)',
                      color: 'var(--color-t2)', fontFamily: 'var(--font-body)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Log a different result
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Step 1: Match details ──────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Sport */}
              <div>
                <label style={labelStyle}>Sport</label>
                <div style={{ position: 'relative' }}>
                  <select value={sport} onChange={(e) => setSport(e.target.value as SportType)} style={inputStyle}>
                    {sportOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronRight size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Format */}
              <div>
                <label style={labelStyle}>Format</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['singles', 'doubles'] as const).map((f) => {
                    const active = format === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setFormat(f)}
                        style={{
                          flex: 1, height: 44, borderRadius: 12,
                          border: active ? 'none' : '1px solid var(--color-bdr)',
                          background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
                          color: active ? '#fff' : 'var(--color-t2)',
                          fontFamily: 'var(--font-body)', fontWeight: 700,
                          fontSize: 14, cursor: 'pointer', textTransform: 'capitalize',
                        }}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opponent */}
              <div>
                <label style={labelStyle}>Opponent</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={opponent?.id || ''}
                    onChange={(e) => setOpponent(connections.find((c) => c.id === e.target.value) || null)}
                    style={inputStyle}
                  >
                    <option value="">Select opponent…</option>
                    {connections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronRight size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                </div>
              </div>

              {format === 'doubles' && (
                <>
                  <div>
                    <label style={labelStyle}>Your Partner</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={partner?.id || ''}
                        onChange={(e) => setPartner(connections.find((c) => c.id === e.target.value) || null)}
                        style={inputStyle}
                      >
                        <option value="">Select partner…</option>
                        {connections.filter((c) => c.id !== opponent?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronRight size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Opponent's Partner</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={opponent2?.id || ''}
                        onChange={(e) => setOpponent2(connections.find((c) => c.id === e.target.value) || null)}
                        style={inputStyle}
                      >
                        <option value="">Select opponent's partner…</option>
                        {connections.filter((c) => c.id !== opponent?.id && c.id !== partner?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronRight size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Score entry ────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--color-t1)' }}>
                  {format === 'doubles' ? 'Your Team' : 'You'}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--color-t3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {scoring.label}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--color-t1)' }}>
                  {format === 'doubles' ? 'Opponents' : opponent?.name}
                </span>
              </div>

              {/* Set rows */}
              {sets.map((set, index) => (
                <div key={index} style={{
                  background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
                  borderRadius: 16, padding: '16px',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-t3)', textAlign: 'center', margin: '0 0 12px' }}>
                    {scoring.type === 'sets' ? `Set ${index + 1}` : `Game ${index + 1}`}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                    {/* Team 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <button
                        onClick={() => handleScoreChange(index, 'team1', -1)}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-t1)' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--color-t1)', minWidth: 30, textAlign: 'center' }}>{set.team1}</span>
                      <button
                        onClick={() => handleScoreChange(index, 'team1', 1)}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-acc)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* Divider */}
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--color-t3)', textAlign: 'center' }}>–</span>
                    {/* Team 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <button
                        onClick={() => handleScoreChange(index, 'team2', -1)}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-surf)', border: '1px solid var(--color-bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-t1)' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--color-t1)', minWidth: 30, textAlign: 'center' }}>{set.team2}</span>
                      <button
                        onClick={() => handleScoreChange(index, 'team2', 1)}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-acc)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Live result pill */}
              {(() => {
                let t1 = 0, t2 = 0;
                sets.forEach((s) => { if (s.team1 > s.team2) t1++; else if (s.team2 > s.team1) t2++; });
                if (t1 === 0 && t2 === 0) return null;
                const needed = Math.ceil(scoring.defaultSets / 2);
                const winner = t1 >= needed ? 1 : t2 >= needed ? 2 : null;
                const isDraw = !winner && sets.length === scoring.defaultSets;
                const [bg, color] = winner === 1
                  ? ['rgba(22,212,106,0.1)', 'var(--color-acc)']
                  : winner === 2
                  ? ['rgba(255,59,48,0.1)', 'var(--color-red)']
                  : isDraw
                  ? ['rgba(255,179,0,0.1)', '#FFB300']
                  : ['var(--color-surf-2)', 'var(--color-t2)'];
                return (
                  <div style={{ borderRadius: 12, padding: '10px 16px', textAlign: 'center', background: bg }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color }}>
                      {winner === 1 && `You lead ${t1}–${t2} sets`}
                      {winner === 2 && `${opponent?.name} leads ${t2}–${t1} sets`}
                      {isDraw && `Draw — ${t1}–${t2}`}
                      {!winner && !isDraw && `${t1}–${t2} sets`}
                    </span>
                  </div>
                );
              })()}

              {/* Add/Remove set */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {sets.length < scoring.defaultSets && (
                  <button
                    onClick={() => setSets([...sets, { team1: 0, team2: 0 }])}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-bdr)', background: 'var(--color-surf-2)', color: 'var(--color-t2)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  >
                    <Plus size={13} /> Add {scoring.type === 'sets' ? 'Set' : 'Game'}
                  </button>
                )}
                {sets.length > 1 && (
                  <button
                    onClick={() => setSets(sets.slice(0, -1))}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-bdr)', background: 'var(--color-surf-2)', color: 'var(--color-t2)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  >
                    <Minus size={13} /> Remove {scoring.type === 'sets' ? 'Set' : 'Game'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Review + Submit ────────────────────────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)',
                borderRadius: 16, padding: '20px', textAlign: 'center',
              }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: 'var(--color-t1)', margin: '0 0 4px' }}>
                  You vs {opponent?.name}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t2)', margin: '0 0 14px' }}>
                  {SPORTS[sport]?.name || sport} · {format === 'singles' ? 'Singles' : 'Doubles'}
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--color-t1)', margin: '0 0 8px' }}>
                  {formatScore()}
                </p>
                {calculateWinner() && (
                  <span style={{
                    display: 'inline-block', padding: '4px 14px', borderRadius: 'var(--radius-full)',
                    background: calculateWinner() === 1 ? 'var(--color-acc-bg)' : 'rgba(255,59,48,0.12)',
                    color: calculateWinner() === 1 ? 'var(--color-acc)' : 'var(--color-red)',
                    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                  }}>
                    {calculateWinner() === 1 ? '🏆 You win!' : `${opponent?.name} wins`}
                  </span>
                )}
              </div>

              {submitError && (
                <div style={{ borderRadius: 12, padding: '12px 16px', background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-red)', margin: 0 }}>{submitError}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Footer buttons ───────────────────────────────────────────── */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid var(--color-bdr)',
          background: 'var(--color-surf)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {step === 1 && <PrimaryBtn onClick={() => setStep(2)} disabled={!opponent}>Next: Enter Score</PrimaryBtn>}
          {step === 2 && <PrimaryBtn onClick={() => setStep(3)}>Next: Review</PrimaryBtn>}
          {step === 3 && (
            <div style={{ display: 'flex', gap: 10 }}>
              <GhostBtn onClick={() => setStep(2)}>Back</GhostBtn>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                style={{
                  flex: 2, height: 50, borderRadius: 'var(--radius-full)',
                  background: submitLoading ? 'var(--color-surf-2)' : 'var(--color-acc)',
                  border: 'none', cursor: submitLoading ? 'default' : 'pointer',
                  color: submitLoading ? 'var(--color-t3)' : '#fff',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                  boxShadow: submitLoading ? 'none' : '0 4px 16px rgba(22,212,106,0.25)',
                  opacity: submitLoading ? 0.6 : 1,
                }}
              >
                {submitLoading ? 'Submitting…' : 'Submit Score'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

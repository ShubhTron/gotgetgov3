import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Plus, Calendar, Clock, Search, Globe, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { SPORT_FORMAT_CONFIG } from '@/lib/scoring';
import { getInitials } from '@/lib/avatar-utils';

interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  sport?: string;
  level?: string;
}

interface TimeSlot {
  id: string;
  date: string;
  time: string;
}

interface Club {
  id: string;
  name: string;
}

interface Ladder {
  id: string;
  name: string;
}

export function CreateMatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [partner, setPartner] = useState<Player | null>(null);
  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [postingMode, setPostingMode] = useState<'open' | 'invite'>('open');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [otherLocation, setOtherLocation] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    // Handle preselected opponent from navigation state
    const state = location.state as { preselectedOpponent?: Player } | null;
    if (state?.preselectedOpponent) {
      setSelectedPlayers([state.preselectedOpponent]);
      setMatchType('singles');
    }
  }, [location.state]);

  useEffect(() => {
    if (!selectedSport) return;
    const config = SPORT_FORMAT_CONFIG[selectedSport];
    if (config) setMatchType(config.defaultFormat);
  }, [selectedSport]);

  const fetchUserData = async () => {
    const [sportsRes, clubsRes, connectionsRes] = await Promise.all([
      supabase.from('user_sport_profiles').select('sport').eq('user_id', user!.id),
      supabase.from('user_clubs').select('club_id, clubs(id, name)').eq('user_id', user!.id),
      supabase.from('connections').select(`
        id,
        connected_user_id,
        profiles!connections_connected_user_id_fkey(id, full_name, avatar_url)
      `).eq('user_id', user!.id).eq('status', 'accepted'),
    ]);

    if (sportsRes.data) {
      const sports = sportsRes.data.map((d) => d.sport as SportType);
      setUserSports(sports);
      if (sports.length === 1) {
        setSelectedSport(sports[0]);
      }
    }

    if (clubsRes.data) {
      const clubList = (clubsRes.data as any[])
        .filter((d) => d.clubs)
        .map((d) => ({ id: (d.clubs as { id: string; name: string }).id, name: (d.clubs as { id: string; name: string }).name }));
      setClubs(clubList);
      if (clubList.length === 1) {
        setSelectedClub(clubList[0]);
      }
    }

    if (connectionsRes.data) {
      const playerList = (connectionsRes.data as any[])
        .filter((d) => d.profiles)
        .map((d) => {
          const profile = d.profiles as { id: string; full_name: string; avatar_url?: string };
          return {
            id: profile.id,
            name: profile.full_name,
            avatarUrl: profile.avatar_url,
          };
        });
      setAvailablePlayers(playerList);
    }
  };

  const addTimeSlot = () => {
    if (timeSlots.length >= 5) return;
    const newSlot: TimeSlot = {
      id: crypto.randomUUID(),
      date: '',
      time: '18:00',
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const updateTimeSlot = (id: string, field: 'date' | 'time', value: string) => {
    setTimeSlots(timeSlots.map((slot) =>
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
  };

  const selectPlayer = (player: Player) => {
    const maxPlayers = matchType === 'singles' ? 1 : 3;
    if (matchType === 'singles') {
      setSelectedPlayers([player]);
    } else {
      if (selectedPlayers.length < maxPlayers && !selectedPlayers.find((p) => p.id === player.id)) {
        setSelectedPlayers([...selectedPlayers, player]);
      }
    }
    setShowPlayerPicker(false);
  };

  const removePlayer = (id: string) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== id));
  };

  const filteredPlayers = availablePlayers.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) &&
    !selectedPlayers.find((s) => s.id === p.id) &&
    partner?.id !== p.id
  );

  const canSubmit = (postingMode === 'open' || selectedPlayers.length > 0) &&
    selectedSport &&
    (selectedClub || otherLocation) &&
    timeSlots.length > 0 &&
    timeSlots.every((slot) => slot.date && slot.time);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const proposedTimes = timeSlots.map((slot) => `${slot.date} ${slot.time}`);

      if (postingMode === 'open') {
        const { data: challenge, error } = await (supabase.from('challenges') as any).insert({
          proposed_by: user!.id,
          sport: selectedSport,
          format: matchType,
          club_id: selectedClub?.id || null,
          location: otherLocation || null,
          proposed_times: proposedTimes,
          ladder_id: selectedLadder?.id || null,
          message: message || null,
          status: 'proposed',
          is_open: true,
        }).select().single();

        if (error) throw error;

        await (supabase.from('challenge_players') as any).insert({
          challenge_id: (challenge as any).id,
          user_id: user!.id,
          team_number: 1,
          response: 'accepted',
        });

        if (partner) {
          await (supabase.from('challenge_players') as any).insert({
            challenge_id: (challenge as any).id,
            user_id: partner.id,
            team_number: 1,
            response: 'pending',
          });
        }

        navigate('/discover');
      } else {
        const { data: challenge, error } = await (supabase.from('challenges') as any).insert({
          proposed_by: user!.id,
          sport: selectedSport,
          format: matchType,
          club_id: selectedClub?.id || null,
          location: otherLocation || null,
          proposed_times: proposedTimes,
          ladder_id: selectedLadder?.id || null,
          message: message || null,
          status: 'proposed',
          is_open: false,
        }).select().single();

        if (error) throw error;

        await (supabase.from('challenge_players') as any).insert({
          challenge_id: (challenge as any).id,
          user_id: user!.id,
          team_number: 1,
          response: 'accepted',
        });

        for (const player of selectedPlayers) {
          await (supabase.from('challenge_players') as any).insert({
            challenge_id: (challenge as any).id,
            user_id: player.id,
            team_number: 2,
            response: 'pending',
          });
        }

        if (partner) {
          await (supabase.from('challenge_players') as any).insert({
            challenge_id: (challenge as any).id,
            user_id: partner.id,
            team_number: 1,
            response: 'pending',
          });
        }

        navigate('/circles');
      }
    } catch (error) {
      console.error('Failed to create match:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── shared style helpers ────────────────────────────────────────────────────
  const fieldLabel: React.CSSProperties = {
    display: 'block', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    color: 'var(--color-t1)', marginBottom: 8,
  };
  const pill = (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '12px 0', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
    border: 'none', cursor: 'pointer',
    background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
    color: active ? '#fff' : 'var(--color-t2)',
    transition: 'background 0.15s, color 0.15s',
  });
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
    border: active ? 'none' : '1px solid var(--color-bdr)',
    cursor: 'pointer',
    background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
    color: active ? '#fff' : 'var(--color-t2)',
    transition: 'background 0.15s',
  });
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    borderRadius: 'var(--radius-xl)',
    fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)',
    background: 'var(--color-surf-2)',
    border: '1px solid var(--color-bdr)',
    outline: 'none', boxSizing: 'border-box',
  };
  const caption: React.CSSProperties = {
    fontFamily: 'var(--font-body)', fontSize: 12,
    color: 'var(--color-t3)', marginTop: 6,
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--color-bg)', borderBottom: '1px solid var(--color-bdr)',
        paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px var(--space-5)', maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, marginLeft: -8, color: 'var(--color-t2)', display: 'flex' }}>
            <X size={22} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>Create Match</h1>
          <div style={{ width: 38 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

        {/* Posting Mode */}
        <div>
          <label style={fieldLabel}>Posting Mode *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setPostingMode('open'); setSelectedPlayers([]); }} style={pill(postingMode === 'open')}>
              <Globe size={16} /> Open
            </button>
            <button onClick={() => setPostingMode('invite')} style={pill(postingMode === 'invite')}>
              <Users size={16} /> Invite Players
            </button>
          </div>
          <p style={caption}>
            {postingMode === 'open'
              ? 'Your match will appear in the Discover deck for others to join.'
              : 'Send a direct invitation to specific players.'}
          </p>
        </div>

        {/* Select Players (invite mode) */}
        {postingMode === 'invite' && (
          <div>
            <label style={fieldLabel}>Select Players *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedPlayers.map((player) => (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-xl)', background: 'var(--color-surf-2)' }}>
                  <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size={34} />
                  <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)' }}>{player.name}</span>
                  <button onClick={() => removePlayer(player.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)', padding: 4, display: 'flex' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              {(matchType === 'singles' ? selectedPlayers.length < 1 : selectedPlayers.length < 3) && (
                <button
                  onClick={() => setShowPlayerPicker(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 'var(--radius-xl)', border: '1.5px dashed var(--color-bdr)', background: 'none', color: 'var(--color-t3)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}
                >
                  <Plus size={18} /> Add player
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sport */}
        <div>
          <label style={fieldLabel}>Sport *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {userSports.map((sport) => (
              <button key={sport} onClick={() => setSelectedSport(sport)} style={chip(selectedSport === sport)}>
                {SPORTS[sport]?.name || sport}
              </button>
            ))}
          </div>
          {userSports.length === 0 && (
            <p style={caption}>Add a sport in your profile to create matches.</p>
          )}
        </div>

        {/* Match Type */}
        <div>
          <label style={fieldLabel}>Match Type *</label>
          {selectedSport && SPORT_FORMAT_CONFIG[selectedSport]?.doublesOnly ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled style={{ ...pill(true), cursor: 'default', opacity: 0.85 }}>Doubles Only</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMatchType('singles')} style={pill(matchType === 'singles')}>Singles</button>
              <button onClick={() => setMatchType('doubles')} style={pill(matchType === 'doubles')}>Doubles</button>
            </div>
          )}
        </div>

        {/* Partner (doubles) */}
        {matchType === 'doubles' && (
          <div>
            <label style={fieldLabel}>Your Partner (Optional)</label>
            {partner ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 'var(--radius-xl)', background: 'var(--color-surf-2)' }}>
                <PlayerAvatar name={partner.name} avatarUrl={partner.avatarUrl} size={34} />
                <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-t1)' }}>{partner.name}</span>
                <button onClick={() => setPartner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)', padding: 4, display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <p style={caption}>You will be the partner by default.</p>
            )}
          </div>
        )}

        {/* Club / Location */}
        <div>
          <label style={fieldLabel}>Club / Location *</label>
          {clubs.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {clubs.map((club) => (
                <button key={club.id} onClick={() => { setSelectedClub(club); setOtherLocation(''); }} style={chip(selectedClub?.id === club.id)}>
                  {club.name}
                </button>
              ))}
            </div>
          )}
          <input
            placeholder="Other location..."
            value={otherLocation}
            onChange={(e) => { setOtherLocation(e.target.value); setSelectedClub(null); }}
            style={inputStyle}
          />
          {clubs.length === 0 && (
            <p style={caption}>Join a club in your profile to select it as a location.</p>
          )}
        </div>

        {/* Time Slots */}
        <div>
          <label style={fieldLabel}>Propose Time Slots * (at least 1)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {timeSlots.map((slot) => (
              <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Calendar size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                    <select
                      value={slot.date}
                      onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 36, appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="">Pick date</option>
                      {Array.from({ length: 14 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() + i);
                        const value = d.toISOString().split('T')[0];
                        const label = i === 0
                          ? 'Today'
                          : i === 1
                          ? 'Tomorrow'
                          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        return <option key={value} value={value}>{label}</option>;
                      })}
                    </select>
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Clock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                    <select
                      value={slot.time}
                      onChange={(e) => updateTimeSlot(slot.id, 'time', e.target.value)}
                      style={{ ...inputStyle, paddingLeft: 36, appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="">Select time</option>
                      {Array.from({ length: 24 * 4 }, (_, i) => {
                        const hours = Math.floor(i / 4);
                        const minutes = (i % 4) * 15;
                        const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const display = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                        return <option key={value} value={value}>{display}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeTimeSlot(slot.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t3)', padding: 6, display: 'flex', flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>
            ))}
            {timeSlots.length < 5 && (
              <button
                onClick={addTimeSlot}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 'var(--radius-xl)', border: '1.5px dashed var(--color-bdr)', background: 'none', color: 'var(--color-t3)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}
              >
                <Plus size={18} /> Add time slot
              </button>
            )}
          </div>
        </div>

        {/* Ladder (if any) */}
        {ladders.length > 0 && (
          <div>
            <label style={fieldLabel}>Ladder Association (Optional)</label>
            <select
              value={selectedLadder?.id || ''}
              onChange={(e) => setSelectedLadder(ladders.find((l) => l.id === e.target.value) || null)}
              style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="">None</option>
              {ladders.map((ladder) => (
                <option key={ladder.id} value={ladder.id}>{ladder.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description / Message */}
        <div>
          <label style={fieldLabel}>
            {postingMode === 'open' ? 'Match Description (Optional)' : 'Message to Players (Optional)'}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={postingMode === 'open' ? 'Describe your match or skill level...' : 'Say something to your players...'}
            maxLength={500}
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
          <p style={{ ...caption, textAlign: 'right', marginTop: 4 }}>{message.length}/500</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={{
            width: '100%', padding: '15px', borderRadius: 'var(--radius-full)',
            border: 'none', cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            background: canSubmit && !isSubmitting ? 'var(--color-acc)' : 'var(--color-surf-2)',
            color: canSubmit && !isSubmitting ? '#fff' : 'var(--color-t3)',
            transition: 'background 0.15s',
            boxShadow: canSubmit && !isSubmitting ? '0 4px 16px rgba(22,212,106,0.3)' : 'none',
          }}
        >
          {isSubmitting
            ? (postingMode === 'open' ? 'Posting...' : 'Sending...')
            : (postingMode === 'open' ? 'Post to Discover' : 'Send Match Request')}
        </button>

        <div style={{ height: 'max(16px, env(safe-area-inset-bottom, 16px))' }} />
      </div>

      {/* Player Picker sheet */}
      <AnimatePresence>
        {showPlayerPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
              onClick={() => setShowPlayerPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, borderRadius: '20px 20px 0 0', maxHeight: '70dvh', overflow: 'hidden', background: 'var(--color-surf)', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-bdr-s)' }} />
              </div>
              <div style={{ padding: '0 var(--space-5) var(--space-5)', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-t1)', margin: 0 }}>Select Player</h3>
                <div style={{ position: 'relative' }}>
                  <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-t3)', pointerEvents: 'none' }} />
                  <input
                    placeholder="Search connections..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 40 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: '40dvh' }}>
                  {filteredPlayers.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}>No connections found</p>
                  ) : (
                    filteredPlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => selectPlayer(player)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-xl)', border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      >
                        <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--color-t1)', margin: 0 }}>{player.name}</p>
                          {player.sport && (
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-t3)', margin: 0 }}>{player.sport}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Small avatar helper ───────────────────────────────────────────────────────
function PlayerAvatar({ name, avatarUrl, size }: { name: string; avatarUrl?: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--color-acc-bg)', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.35, fontWeight: 700, color: 'var(--color-acc)' }}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

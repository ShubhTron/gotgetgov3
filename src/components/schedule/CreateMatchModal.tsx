import { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, Search, Globe, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/avatar-utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { cn } from '@/lib/utils';

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

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedOpponent?: Player;
  swipeId?: string | null;
  onSuccess?: () => void;
}

export function CreateMatchModal({
  isOpen,
  onClose,
  preselectedOpponent,
  swipeId,
  onSuccess,
}: CreateMatchModalProps) {
  const { user } = useAuth();

  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [partner, setPartner] = useState<Player | null>(null);
  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [postingMode, setPostingMode] = useState<'open' | 'invite'>('invite');
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
    if (isOpen && user) {
      fetchUserData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (preselectedOpponent) {
      setSelectedPlayers([preselectedOpponent]);
      setMatchType('singles');
      setPostingMode('invite');
    }
  }, [preselectedOpponent]);

  useEffect(() => {
    if (selectedSport === 'padel' || selectedSport === 'pickleball') {
      setMatchType('doubles');
    }
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
      const clubList = clubsRes.data
        .filter((d) => d.clubs)
        .map((d) => ({ id: (d.clubs as { id: string; name: string }).id, name: (d.clubs as { id: string; name: string }).name }));
      setClubs(clubList);
      if (clubList.length === 1) {
        setSelectedClub(clubList[0]);
      }
    }

    if (connectionsRes.data) {
      const playerList = connectionsRes.data
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
        const { data: challenge, error } = await supabase.from('challenges').insert({
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

        await supabase.from('challenge_players').insert({
          challenge_id: challenge.id,
          user_id: user!.id,
          team_number: 1,
          response: 'accepted',
        });

        if (partner) {
          await supabase.from('challenge_players').insert({
            challenge_id: challenge.id,
            user_id: partner.id,
            team_number: 1,
            response: 'pending',
          });
        }
      } else {
        const { data: challenge, error } = await supabase.from('challenges').insert({
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

        await supabase.from('challenge_players').insert({
          challenge_id: challenge.id,
          user_id: user!.id,
          team_number: 1,
          response: 'accepted',
        });

        for (const player of selectedPlayers) {
          await supabase.from('challenge_players').insert({
            challenge_id: challenge.id,
            user_id: player.id,
            team_number: 2,
            response: 'pending',
          });
        }

        if (partner) {
          await supabase.from('challenge_players').insert({
            challenge_id: challenge.id,
            user_id: partner.id,
            team_number: 1,
            response: 'pending',
          });
        }

        // If this match was created from an invite (swipeId exists), delete the swipe match
        if (swipeId) {
          console.log('Deleting swipe match with ID:', swipeId);
          const { error: deleteError } = await supabase.from('swipe_matches').delete().eq('id', swipeId);
          if (deleteError) {
            console.error('Error deleting swipe match:', deleteError);
          } else {
            console.log('Successfully deleted swipe match');
          }
        }
      }

      // If this match was created from an invite (swipeId exists), delete the swipe match
      if (swipeId) {
        console.log('Deleting swipe match with ID:', swipeId);
        const { error: deleteError } = await supabase.from('swipe_matches').delete().eq('id', swipeId);
        if (deleteError) {
          console.error('Error deleting swipe match:', deleteError);
        } else {
          console.log('Successfully deleted swipe match');
        }
      }

      // Close modal first
      onClose();

      // Then trigger success callback to refresh the lists
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create match:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-xl"
          style={{ background: 'var(--color-surf)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="sticky top-0 z-10"
            style={{ background: 'var(--color-surf)', borderBottom: '1px solid var(--color-bdr)' }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <h1
                className="text-h3 font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-t1)' }}
              >
                Create Match
              </h1>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
                style={{ color: 'var(--color-t2)' }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-4 py-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div>
              <label
                className="block text-label font-medium mb-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
              >
                Posting Mode *
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPostingMode('open'); setSelectedPlayers([]); }}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-[8px] text-label font-medium transition-colors'
                  )}
                  style={
                    postingMode === 'open'
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: 'var(--color-surf-2)', color: 'var(--color-t2)' }
                  }
                >
                  <Globe className="w-4 h-4" />
                  Open
                </button>
                <button
                  onClick={() => setPostingMode('invite')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-[8px] text-label font-medium transition-colors'
                  )}
                  style={
                    postingMode === 'invite'
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: 'var(--color-surf-2)', color: 'var(--color-t2)' }
                  }
                >
                  <Users className="w-4 h-4" />
                  Invite Players
                </button>
              </div>
              <p
                className="text-caption mt-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}
              >
                {postingMode === 'open'
                  ? 'Your match will appear in the Discover deck for others to join.'
                  : 'Send a direct invitation to specific players.'}
              </p>
            </div>

            {postingMode === 'invite' && (
              <div>
                <label
                  className="block text-label font-medium mb-2"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
                >
                  Select Players *
                </label>
                <div className="space-y-2">
                  {selectedPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 p-3 rounded-[8px]"
                      style={{ background: 'var(--color-surf-2)' }}
                    >
                      <Avatar size="sm">
                        <AvatarImage src={player.avatarUrl} />
                        <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                      </Avatar>
                      <span
                        className="flex-1 text-body"
                        style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
                      >
                        {player.name}
                      </span>
                      {!preselectedOpponent && (
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="p-1 transition-colors"
                          style={{ color: 'var(--color-t3)' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!preselectedOpponent && (matchType === 'singles' ? selectedPlayers.length < 1 : selectedPlayers.length < 3) && (
                    <button
                      onClick={() => setShowPlayerPicker(true)}
                      className="w-full flex items-center gap-3 p-3 border-2 border-dashed rounded-[8px] transition-colors hover:border-[var(--color-acc)]"
                      style={{ borderColor: 'var(--color-bdr)', color: 'var(--color-t3)' }}
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add player</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-label font-medium mb-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
              >
                Sport *
              </label>
              <div className="flex flex-wrap gap-2">
                {userSports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className="px-4 py-2 rounded-full text-label font-medium transition-colors"
                    style={
                      selectedSport === sport
                        ? { background: 'var(--color-acc)', color: '#fff' }
                        : { background: 'var(--color-surf-2)', color: 'var(--color-t2)' }
                    }
                  >
                    {SPORTS[sport]?.name || sport}
                  </button>
                ))}
              </div>
              {userSports.length === 0 && (
                <p
                  className="text-caption mt-2"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}
                >
                  Add a sport in your profile to create matches.
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-label font-medium mb-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
              >
                Match Type *
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMatchType('singles')}
                  className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                  style={
                    matchType === 'singles'
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: 'var(--color-surf-2)', color: 'var(--color-t2)' }
                  }
                >
                  Singles
                </button>
                <button
                  onClick={() => setMatchType('doubles')}
                  className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                  style={
                    matchType === 'doubles'
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: 'var(--color-surf-2)', color: 'var(--color-t2)' }
                  }
                >
                  Doubles
                </button>
              </div>
            </div>

            <div>
              <label
                className="block text-label font-medium mb-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
              >
                Club / Location *
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => { setSelectedClub(club); setOtherLocation(''); }}
                    className="px-4 py-2 rounded-full text-label font-medium transition-colors"
                    style={
                      selectedClub?.id === club.id
                        ? { background: 'var(--color-acc)', color: '#fff' }
                        : { background: 'var(--color-surf-2)', color: 'var(--color-t2)' }
                    }
                  >
                    {club.name}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Other location..."
                value={otherLocation}
                onChange={(e) => { setOtherLocation(e.target.value); setSelectedClub(null); }}
              />
              {clubs.length === 0 && (
                <p
                  className="text-caption mt-2"
                  style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}
                >
                  Join a club in your profile to select it as a location.
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-label font-medium mb-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
              >
                Propose Time Slots * (at least 1)
              </label>
              <div className="space-y-3">
                {timeSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 relative">
                        <Calendar
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color: 'var(--color-t3)' }}
                        />
                        <input
                          type="date"
                          value={slot.date}
                          min={new Date().toISOString().split('T')[0]}
                          max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          onChange={(e) => updateTimeSlot(slot.id, 'date', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-[8px] text-body"
                          style={{
                            background: 'var(--color-surf-2)',
                            border: '1px solid var(--color-bdr)',
                            color: 'var(--color-t1)',
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Clock
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                          style={{ color: 'var(--color-t3)' }}
                        />
                        <select
                          value={slot.time}
                          onChange={(e) => updateTimeSlot(slot.id, 'time', e.target.value)}
                          className="w-full pl-10 pr-3 py-2 rounded-[8px] text-body appearance-none"
                          style={{
                            background: 'var(--color-surf-2)',
                            border: '1px solid var(--color-bdr)',
                            color: 'var(--color-t1)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          <option value="">Select time</option>
                          {Array.from({ length: 24 * 4 }, (_, i) => {
                            const hours = Math.floor(i / 4);
                            const minutes = (i % 4) * 15;
                            const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                            const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                            const period = hours >= 12 ? 'PM' : 'AM';
                            const display = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                            return (
                              <option key={value} value={value}>{display}</option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTimeSlot(slot.id)}
                      className="p-2 transition-colors"
                      style={{ color: 'var(--color-t3)' }}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {timeSlots.length < 5 && (
                  <button
                    onClick={addTimeSlot}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-[8px] transition-colors hover:border-[var(--color-acc)]"
                    style={{ borderColor: 'var(--color-bdr)', color: 'var(--color-t3)' }}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add time slot</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                className="block text-label font-medium mb-2"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
              >
                Match Description (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your match or skill level..."
                maxLength={500}
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{
                  background: 'var(--color-surf-2)',
                  border: '1px solid var(--color-bdr)',
                  color: 'var(--color-t1)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <p
                className="text-caption mt-1 text-right"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}
              >
                {message.length}/500
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full"
            >
              {isSubmitting
                ? (postingMode === 'open' ? 'Posting...' : 'Sending...')
                : (postingMode === 'open' ? 'Post to Discover' : 'Send Match Request')}
            </Button>
          </div>

          <AnimatePresence>
            {showPlayerPicker && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-[60]"
                  onClick={() => setShowPlayerPicker(false)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-[16px] max-h-[70vh] overflow-hidden"
                  style={{ background: 'var(--color-surf)' }}
                >
                  <div className="flex justify-center pt-3 pb-2">
                    <div
                      className="w-10 h-1 rounded-full"
                      style={{ background: 'var(--color-bdr)' }}
                    />
                  </div>
                  <div className="px-4 pb-4">
                    <h3
                      className="text-h3 font-bold mb-4"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-t1)' }}
                    >
                      Select Player
                    </h3>
                    <div className="relative mb-4">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                        style={{ color: 'var(--color-t3)' }}
                      />
                      <Input
                        placeholder="Search connections..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                      {filteredPlayers.length === 0 ? (
                        <p
                          className="text-center py-8"
                          style={{ color: 'var(--color-t3)', fontFamily: 'var(--font-body)' }}
                        >
                          No connections found
                        </p>
                      ) : (
                        filteredPlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={() => selectPlayer(player)}
                            className="w-full flex items-center gap-3 p-3 rounded-[8px] transition-colors hover:bg-black/5"
                          >
                            <Avatar>
                              <AvatarImage src={player.avatarUrl} />
                              <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p
                                className="text-label font-medium"
                                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}
                              >
                                {player.name}
                              </p>
                              {player.sport && (
                                <p
                                  className="text-caption"
                                  style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t3)' }}
                                >
                                  {player.sport}
                                </p>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

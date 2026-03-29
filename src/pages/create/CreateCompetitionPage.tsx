import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Layers, Trophy, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { cn } from '@/lib/utils';

type CompetitionType = 'ladder' | 'league' | 'tournament';
type MatchType = 'singles' | 'doubles' | 'mixed';
type LeagueFormat = 'round_robin' | 'group_stage';
type TournamentFormat = 'single_elimination' | 'double_elimination' | 'swiss';
type SeedingMethod = 'manual' | 'rating' | 'random';

interface Club {
  id: string;
  name: string;
}

interface ExistingLadder {
  id: string;
  name: string;
  match_type: string;
  member_count: number;
}

export function CreateCompetitionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [competitionType, setCompetitionType] = useState<CompetitionType | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('singles');

  const [existingLadders, setExistingLadders] = useState<ExistingLadder[]>([]);
  const [showExistingLadders, setShowExistingLadders] = useState(false);

  const [ladderDescription, setLadderDescription] = useState('');
  const [ladderRules, setLadderRules] = useState('');
  const [ladderRegistration, setLadderRegistration] = useState<'open' | 'invite'>('open');

  const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>('round_robin');
  const [leagueStartDate, setLeagueStartDate] = useState('');
  const [leagueEndDate, setLeagueEndDate] = useState('');
  const [leagueDeadline, setLeagueDeadline] = useState('');
  const [leagueSchedule, setLeagueSchedule] = useState('');
  const [leagueMaxTeams, setLeagueMaxTeams] = useState('');
  const [leagueSkillLevel, setLeagueSkillLevel] = useState('any');
  const [leagueCost, setLeagueCost] = useState('');
  const [leagueDescription, setLeagueDescription] = useState('');
  const [leagueRules, setLeagueRules] = useState('');

  const [tournamentFormat, setTournamentFormat] = useState<TournamentFormat>('single_elimination');
  const [tournamentStartDate, setTournamentStartDate] = useState('');
  const [tournamentEndDate, setTournamentEndDate] = useState('');
  const [tournamentDeadline, setTournamentDeadline] = useState('');
  const [seedingMethod, setSeedingMethod] = useState<SeedingMethod>('rating');
  const [tournamentMaxTeams, setTournamentMaxTeams] = useState('');
  const [tournamentSkillLevel, setTournamentSkillLevel] = useState('any');
  const [tournamentCost, setTournamentCost] = useState('');
  const [tournamentDescription, setTournamentDescription] = useState('');
  const [tournamentRules, setTournamentRules] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTotalSteps = () => {
    if (!competitionType) return 1;
    if (competitionType === 'ladder') return showExistingLadders ? 3 : 2;
    return 4;
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClub && selectedSport && competitionType === 'ladder') {
      checkExistingLadders();
    }
  }, [selectedClub, selectedSport, competitionType]);

  const fetchUserData = async () => {
    const [sportsRes, clubsRes] = await Promise.all([
      supabase.from('user_sport_profiles').select('sport').eq('user_id', user!.id),
      supabase.from('user_clubs').select('club_id, clubs(id, name)').eq('user_id', user!.id),
    ]);

    if (sportsRes.data) {
      setUserSports(sportsRes.data.map((d) => d.sport as SportType));
    }

    if (clubsRes.data) {
      const clubList = clubsRes.data
        .filter((d) => d.clubs)
        .map((d) => ({ id: (d.clubs as unknown as { id: string; name: string }).id, name: (d.clubs as unknown as { id: string; name: string }).name }));
      setClubs(clubList);
      if (clubList.length === 1) {
        setSelectedClub(clubList[0]);
      }
    }
  };

  const checkExistingLadders = async () => {
    const { data } = await supabase
      .from('ladders')
      .select('id, name, match_type, ladder_entries(count)')
      .eq('club_id', selectedClub!.id)
      .eq('sport', selectedSport as any)
      .eq('is_active', true);

    if (data && data.length > 0) {
      const ladders = (data as any[]).map((l) => ({
        id: l.id,
        name: l.name,
        match_type: l.match_type,
        member_count: (l.ladder_entries as { count: number }[])?.[0]?.count || 0,
      }));
      setExistingLadders(ladders);
      setShowExistingLadders(true);
    } else {
      setExistingLadders([]);
      setShowExistingLadders(false);
    }
  };

  const joinLadder = async (ladderId: string) => {
    setIsSubmitting(true);
    try {
      const { data: maxPosition } = await supabase
        .from('ladder_entries')
        .select('position')
        .eq('ladder_id', ladderId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

      await (supabase.from('ladder_entries') as any).insert({
        ladder_id: ladderId,
        user_id: user!.id,
        position: ((maxPosition as any)?.position || 0) + 1,
      });

      navigate(-1);
    } catch (error) {
      console.error('Failed to join ladder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const competitionTypes: { id: CompetitionType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'ladder', label: 'Ladder', description: 'Ongoing challenge rankings', icon: Layers },
    { id: 'league', label: 'League', description: 'Scheduled round-robin play', icon: Trophy },
    { id: 'tournament', label: 'Tournament', description: 'Bracket-based knockout', icon: Target },
  ];

  const canProceedStep1 = selectedClub && selectedSport && competitionType && name && matchType;

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (competitionType === 'ladder') {
        const { data: ladder, error } = await (supabase.from('ladders') as any).insert({
          club_id: selectedClub!.id,
          name,
          sport: selectedSport,
          match_type: matchType,
          description: ladderDescription || null,
          rules: ladderRules || null,
          registration_type: ladderRegistration,
          is_active: true,
          created_by: user!.id,
        }).select().single();

        if (error) throw error;

        await (supabase.from('ladder_entries') as any).insert({
          ladder_id: (ladder as any).id,
          user_id: user!.id,
          position: 1,
        });
      } else if (competitionType === 'league') {
        await (supabase.from('competitions') as any).insert({
          club_id: selectedClub!.id,
          name,
          sport: selectedSport,
          competition_type: 'league',
          match_type: matchType,
          format: leagueFormat,
          start_date: leagueStartDate,
          end_date: leagueEndDate,
          registration_deadline: leagueDeadline,
          schedule_preferences: leagueSchedule || null,
          max_participants: leagueMaxTeams ? parseInt(leagueMaxTeams) : null,
          skill_level: leagueSkillLevel !== 'any' ? leagueSkillLevel : null,
          cost: leagueCost || null,
          description: leagueDescription || null,
          rules: leagueRules || null,
          status: 'registration_open',
          created_by: user!.id,
        });
      } else if (competitionType === 'tournament') {
        await (supabase.from('competitions') as any).insert({
          club_id: selectedClub!.id,
          name,
          sport: selectedSport,
          competition_type: 'tournament',
          match_type: matchType,
          format: tournamentFormat,
          start_date: tournamentStartDate,
          end_date: tournamentEndDate,
          registration_deadline: tournamentDeadline,
          seeding_method: seedingMethod,
          max_participants: tournamentMaxTeams ? parseInt(tournamentMaxTeams) : null,
          skill_level: tournamentSkillLevel !== 'any' ? tournamentSkillLevel : null,
          cost: tournamentCost || null,
          description: tournamentDescription || null,
          rules: tournamentRules || null,
          status: 'registration_open',
          created_by: user!.id,
        });
      }

      navigate(-1);
    } catch (error) {
      console.error('Failed to create competition:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = getTotalSteps();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surf)' }}>
      <div className="sticky top-0 z-10 safe-top" style={{ background: 'var(--color-surf)', borderBottom: '1px solid var(--color-bdr)' }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => step > 1 ? handleBack() : navigate(-1)}
            className="p-2 -ml-2"
            style={{ color: 'var(--color-t2)' }}
          >
            {step > 1 ? <ChevronLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
          <h1 className="text-h3 font-bold" style={{ color: 'var(--color-t1)' }}>Create Competition</h1>
          <div className="w-10" />
        </div>
        <div className="flex justify-center gap-2 pb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i + 1 <= step ? 'var(--color-acc)' : 'var(--color-bdr)' }}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto pb-24">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Competition Type *
              </label>
              <div className="space-y-2">
                {competitionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setCompetitionType(type.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-[12px] text-left transition-colors"
                      style={competitionType === type.id
                        ? { background: 'color-mix(in srgb, var(--color-acc) 10%, transparent)', border: '2px solid var(--color-acc)' }
                        : { background: '#f9fafb', border: '2px solid transparent' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={competitionType === type.id
                          ? { background: 'color-mix(in srgb, var(--color-acc) 20%, transparent)' }
                          : { background: '#e5e7eb' }}
                      >
                        <span style={{ color: competitionType === type.id ? 'var(--color-acc)' : 'var(--color-t3)', display: 'flex' }}>
                          <Icon className="w-5 h-5" />
                        </span>
                      </div>
                      <div>
                        <p className="text-label font-semibold" style={{ color: 'var(--color-t1)' }}>{type.label}</p>
                        <p className="text-caption" style={{ color: 'var(--color-t3)' }}>{type.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Select Club *
              </label>
              <div className="space-y-2">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => setSelectedClub(club)}
                    className="w-full p-4 rounded-[8px] text-left transition-colors"
                    style={selectedClub?.id === club.id
                      ? { background: 'color-mix(in srgb, var(--color-acc) 10%, transparent)', border: '2px solid var(--color-acc)' }
                      : { background: '#f9fafb', border: '2px solid transparent' }}
                  >
                    <span className="text-body font-medium" style={{ color: 'var(--color-t1)' }}>{club.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Sport *
              </label>
              <div className="flex flex-wrap gap-2">
                {userSports.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className="px-4 py-2 rounded-full text-label font-medium transition-colors"
                    style={selectedSport === sport
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                  >
                    {SPORTS[sport]?.name || sport}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Competition Name *
              </label>
              <Input
                placeholder={
                  competitionType === 'ladder' ? "e.g. Men's Pickleball Ladder" :
                  competitionType === 'league' ? 'e.g. Spring Padel League' :
                  'e.g. Club Championship'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Match Type *
              </label>
              <div className="flex gap-2">
                {(['singles', 'doubles', 'mixed'] as MatchType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMatchType(type)}
                    className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors capitalize"
                    style={matchType === type
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && competitionType === 'ladder' && showExistingLadders && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-body" style={{ color: 'var(--color-t2)' }}>
                This club already has {SPORTS[selectedSport!]?.name} ladders:
              </p>
            </div>
            <div className="space-y-3">
              {existingLadders.map((ladder) => (
                <Card key={ladder.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-label font-semibold" style={{ color: 'var(--color-t1)' }}>{ladder.name}</p>
                      <p className="text-caption" style={{ color: 'var(--color-t3)' }}>
                        {ladder.match_type} - {ladder.member_count} members
                      </p>
                    </div>
                    <Button size="sm" onClick={() => joinLadder(ladder.id)} disabled={isSubmitting}>
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <button
              onClick={() => { setShowExistingLadders(false); handleNext(); }}
              className="w-full text-center text-label font-medium py-4"
              style={{ color: 'var(--color-acc)' }}
            >
              Create New Ladder Anyway
            </button>
          </div>
        )}

        {step === (showExistingLadders ? 3 : 2) && competitionType === 'ladder' && !showExistingLadders && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Description
              </label>
              <textarea
                value={ladderDescription}
                onChange={(e) => setLadderDescription(e.target.value)}
                placeholder="Describe the ladder..."
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Challenge Rules
              </label>
              <textarea
                value={ladderRules}
                onChange={(e) => setLadderRules(e.target.value)}
                placeholder="e.g. Can only challenge up to 3 positions above you."
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Registration
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLadderRegistration('open')}
                  className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                  style={ladderRegistration === 'open'
                    ? { background: 'var(--color-acc)', color: '#fff' }
                    : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                >
                  Open
                </button>
                <button
                  onClick={() => setLadderRegistration('invite')}
                  className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                  style={ladderRegistration === 'invite'
                    ? { background: 'var(--color-acc)', color: '#fff' }
                    : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                >
                  Invite Only
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && competitionType === 'league' && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Format *
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLeagueFormat('round_robin')}
                  className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                  style={leagueFormat === 'round_robin'
                    ? { background: 'var(--color-acc)', color: '#fff' }
                    : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                >
                  Round Robin
                </button>
                <button
                  onClick={() => setLeagueFormat('group_stage')}
                  className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                  style={leagueFormat === 'group_stage'
                    ? { background: 'var(--color-acc)', color: '#fff' }
                    : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                >
                  Group Stage
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={leagueStartDate}
                  onChange={(e) => setLeagueStartDate(e.target.value)}
                  className="w-full p-3 rounded-[8px] text-body"
                  style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                />
              </div>
              <div>
                <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={leagueEndDate}
                  onChange={(e) => setLeagueEndDate(e.target.value)}
                  className="w-full p-3 rounded-[8px] text-body"
                  style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Registration Deadline *
              </label>
              <input
                type="date"
                value={leagueDeadline}
                onChange={(e) => setLeagueDeadline(e.target.value)}
                className="w-full p-3 rounded-[8px] text-body"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Schedule Preferences
              </label>
              <Input
                placeholder="e.g. Matches on Tuesdays and Thursdays"
                value={leagueSchedule}
                onChange={(e) => setLeagueSchedule(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && competitionType === 'league' && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Max Teams / Players
              </label>
              <Input
                type="number"
                placeholder="No limit"
                value={leagueMaxTeams}
                onChange={(e) => setLeagueMaxTeams(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Skill Level Requirement
              </label>
              <select
                value={leagueSkillLevel}
                onChange={(e) => setLeagueSkillLevel(e.target.value)}
                className="w-full p-3 rounded-[8px] text-body"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              >
                <option value="any">Any</option>
                <option value="beginner+">Beginner+</option>
                <option value="intermediate+">Intermediate+</option>
                <option value="advanced+">Advanced+</option>
              </select>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Cost / Entry Fee
              </label>
              <Input
                placeholder="Free"
                value={leagueCost}
                onChange={(e) => setLeagueCost(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && competitionType === 'league' && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Description
              </label>
              <textarea
                value={leagueDescription}
                onChange={(e) => setLeagueDescription(e.target.value)}
                placeholder="Describe the league..."
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Rules
              </label>
              <textarea
                value={leagueRules}
                onChange={(e) => setLeagueRules(e.target.value)}
                placeholder="League rules..."
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>
          </div>
        )}

        {step === 2 && competitionType === 'tournament' && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Format *
              </label>
              <div className="flex flex-wrap gap-2">
                {([
                  { id: 'single_elimination', label: 'Single Elim' },
                  { id: 'double_elimination', label: 'Double Elim' },
                  { id: 'swiss', label: 'Swiss' },
                ] as { id: TournamentFormat; label: string }[]).map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setTournamentFormat(format.id)}
                    className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                    style={tournamentFormat === format.id
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={tournamentStartDate}
                  onChange={(e) => setTournamentStartDate(e.target.value)}
                  className="w-full p-3 rounded-[8px] text-body"
                  style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                />
              </div>
              <div>
                <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={tournamentEndDate}
                  onChange={(e) => setTournamentEndDate(e.target.value)}
                  className="w-full p-3 rounded-[8px] text-body"
                  style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Registration Deadline *
              </label>
              <input
                type="date"
                value={tournamentDeadline}
                onChange={(e) => setTournamentDeadline(e.target.value)}
                className="w-full p-3 rounded-[8px] text-body"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Seeding Method *
              </label>
              <div className="flex gap-2">
                {([
                  { id: 'manual', label: 'Manual' },
                  { id: 'rating', label: 'Rating' },
                  { id: 'random', label: 'Random' },
                ] as { id: SeedingMethod; label: string }[]).map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSeedingMethod(method.id)}
                    className="flex-1 py-3 rounded-[8px] text-label font-medium transition-colors"
                    style={seedingMethod === method.id
                      ? { background: 'var(--color-acc)', color: '#fff' }
                      : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && competitionType === 'tournament' && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Max Teams / Players
              </label>
              <Input
                type="number"
                placeholder="No limit"
                value={tournamentMaxTeams}
                onChange={(e) => setTournamentMaxTeams(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Skill Level Requirement
              </label>
              <select
                value={tournamentSkillLevel}
                onChange={(e) => setTournamentSkillLevel(e.target.value)}
                className="w-full p-3 rounded-[8px] text-body"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              >
                <option value="any">Any</option>
                <option value="beginner+">Beginner+</option>
                <option value="intermediate+">Intermediate+</option>
                <option value="advanced+">Advanced+</option>
              </select>
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Cost / Entry Fee
              </label>
              <Input
                placeholder="Free"
                value={tournamentCost}
                onChange={(e) => setTournamentCost(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && competitionType === 'tournament' && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Description
              </label>
              <textarea
                value={tournamentDescription}
                onChange={(e) => setTournamentDescription(e.target.value)}
                placeholder="Describe the tournament..."
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Rules
              </label>
              <textarea
                value={tournamentRules}
                onChange={(e) => setTournamentRules(e.target.value)}
                placeholder="Tournament rules..."
                rows={3}
                className="w-full p-3 rounded-[8px] text-body resize-none"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom" style={{ background: 'var(--color-surf)', borderTop: '1px solid var(--color-bdr)' }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && !(step === 2 && competitionType === 'ladder' && showExistingLadders) && (
            <Button variant="secondary" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {step < totalSteps && !(step === 2 && competitionType === 'ladder' && showExistingLadders) ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : false}
              className="flex-1"
            >
              Next
            </Button>
          ) : !(step === 2 && competitionType === 'ladder' && showExistingLadders) && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : `Create ${competitionType === 'ladder' ? 'Ladder' : competitionType === 'league' ? 'League' : 'Tournament'}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

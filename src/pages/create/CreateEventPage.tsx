import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Play, RotateCcw, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';
import { cn } from '@/lib/utils';

type EventType = 'open_play' | 'round_robin' | 'clinic';
type MatchType = 'singles' | 'doubles' | 'mixed';
type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';

interface Club {
  id: string;
  name: string;
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [userSports, setUserSports] = useState<SportType[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [eventType, setEventType] = useState<EventType | null>(null);

  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('weekly');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const [matchType, setMatchType] = useState<MatchType>('doubles');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [skillLevel, setSkillLevel] = useState('any');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    const [sportsRes, clubsRes] = await Promise.all([
      supabase.from('user_sport_profiles').select('sport').eq('user_id', user!.id),
      supabase.from('user_clubs').select('club_id, clubs(id, name)').eq('user_id', user!.id),
    ]);

    if (sportsRes.data) {
      setUserSports(sportsRes.data.map((d) => d.sport as SportType));
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
  };

  const eventTypes: { id: EventType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'open_play', label: 'Open Play', description: 'Casual drop-in play session', icon: Play },
    { id: 'round_robin', label: 'Round Robin', description: 'Rotating matches for all players', icon: RotateCcw },
    { id: 'clinic', label: 'Clinic', description: 'Instructional session or lesson', icon: GraduationCap },
  ];

  const canProceedStep1 = selectedClub && selectedSport && eventType;
  const canProceedStep2 = eventDate && startTime && endTime && (!isRecurring || recurrenceEndDate);
  const canSubmit = canProceedStep1 && canProceedStep2;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      const eventTypeName = eventTypes.find((e) => e.id === eventType)?.label || 'Event';
      const sportName = SPORTS[selectedSport!]?.name || selectedSport;
      const eventName = `${eventTypeName} - ${sportName}`;

      const startDateTime = new Date(`${eventDate}T${startTime}`);
      const endDateTime = new Date(`${eventDate}T${endTime}`);

      let recurrenceRule = null;
      if (isRecurring && recurrenceEndDate) {
        recurrenceRule = `FREQ=${recurrenceFrequency.toUpperCase()};UNTIL=${recurrenceEndDate.replace(/-/g, '')}`;
      }

      const { error } = await (supabase.from('events') as any).insert({
        club_id: selectedClub!.id,
        created_by: user!.id,
        sport: selectedSport as SportType,
        name: eventName,
        description: description || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_recurring: isRecurring,
        recurrence_rule: recurrenceRule,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        is_casual: eventType === 'open_play',
      });

      if (error) throw error;

      navigate(-1);
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-h3 font-bold" style={{ color: 'var(--color-t1)' }}>Create Event</h1>
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

      <div className="px-4 py-6 max-w-lg mx-auto">
        {step === 1 && (
          <div className="space-y-6">
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
                {clubs.length === 0 && (
                  <p className="text-caption py-4 text-center" style={{ color: 'var(--color-t3)' }}>
                    Join a club to create events.
                  </p>
                )}
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
                Event Type *
              </label>
              <div className="space-y-2">
                {eventTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setEventType(type.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-[12px] text-left transition-colors"
                      style={eventType === type.id
                        ? { background: 'color-mix(in srgb, var(--color-acc) 10%, transparent)', border: '2px solid var(--color-acc)' }
                        : { background: '#f9fafb', border: '2px solid transparent' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={eventType === type.id
                          ? { background: 'color-mix(in srgb, var(--color-acc) 20%, transparent)' }
                          : { background: '#e5e7eb' }}
                      >
                        <span style={{ color: eventType === type.id ? 'var(--color-acc)' : 'var(--color-t3)', display: 'flex' }}>
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Date *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-3 rounded-[8px] text-body"
                style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-3 rounded-[8px] text-body"
                  style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                />
              </div>
              <div>
                <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-3 rounded-[8px] text-body"
                  style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-label font-medium" style={{ color: 'var(--color-t1)' }}>
                  Recurring Event
                </label>
                <button
                  onClick={() => setIsRecurring(!isRecurring)}
                  className="w-12 h-6 rounded-full transition-colors relative"
                  style={{ background: isRecurring ? 'var(--color-acc)' : '#d1d5db' }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform"
                    style={{ transform: isRecurring ? 'translateX(1.5rem)' : 'translateX(0.125rem)' }}
                  />
                </button>
              </div>

              {isRecurring && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-caption mb-2" style={{ color: 'var(--color-t3)' }}>Frequency</label>
                    <div className="flex gap-2">
                      {(['weekly', 'biweekly', 'monthly'] as RecurrenceFrequency[]).map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setRecurrenceFrequency(freq)}
                          className="flex-1 py-2 rounded-full text-label font-medium transition-colors capitalize"
                          style={recurrenceFrequency === freq
                            ? { background: 'var(--color-acc)', color: '#fff' }
                            : { background: '#f3f4f6', color: 'var(--color-t2)' }}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-caption mb-2" style={{ color: 'var(--color-t3)' }}>Repeat Until</label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full p-3 rounded-[8px] text-body"
                      style={{ background: '#f9fafb', border: '1px solid var(--color-bdr)', color: 'var(--color-t1)' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {eventType === 'round_robin' && (
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
            )}

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Max Participants
              </label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Skill Level Requirement
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
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
                Cost / Fee
              </label>
              <Input
                placeholder="Free"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-label font-medium mb-2" style={{ color: 'var(--color-t1)' }}>
                Description / Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about this event..."
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
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

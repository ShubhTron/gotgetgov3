import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { SportIcon } from '@/components/ui/SportIcon';
import { SkillSlider, skillValueToString, skillStringToValue } from '@/components/ui/SkillSlider';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SPORTS, type SportType } from '@/types';

export function MySportsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSports, setSelectedSports] = useState<SportType[]>([]);
  const [sportLevels, setSportLevels] = useState<Record<SportType, number>>({} as Record<SportType, number>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserSports();
    }
  }, [user]);

  const fetchUserSports = async () => {
    const { data } = await supabase
      .from('user_sport_profiles')
      .select('sport, self_assessed_level')
      .eq('user_id', user!.id);

    if (data) {
      const sports = data.map((d) => d.sport as SportType);
      const levels: Record<SportType, number> = {} as Record<SportType, number>;
      data.forEach((d) => {
        levels[d.sport as SportType] = skillStringToValue(d.self_assessed_level || 'beginner');
      });
      setSelectedSports(sports);
      setSportLevels(levels);
    }
    setLoading(false);
  };

  const toggleSport = (sport: SportType) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('user_sport_profiles').delete().eq('user_id', user!.id);
      for (const sport of selectedSports) {
        await (supabase.from('user_sport_profiles') as any).insert({
          user_id: user!.id,
          sport,
          self_assessed_level: skillValueToString(sportLevels[sport] ?? 0),
        });
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving sports:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid var(--color-acc)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-bdr)', background: 'var(--color-surf)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: 8, marginLeft: -8, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-t2)' }}
        >
          <ChevronLeft style={{ width: 24, height: 24 }} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--color-t1)' }}>My Sports</h1>
        <div style={{ width: 40 }} />
      </header>

      <main style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 512, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--color-t1)', marginBottom: 8 }}>
            Select Your Sports
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-t2)', marginBottom: 24 }}>
            Choose the sports you play and set your skill level.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {Object.entries(SPORTS).map(([key, sport]) => {
              const isSelected = selectedSports.includes(key as SportType);
              return (
                <div
                  key={key}
                  onClick={() => toggleSport(key as SportType)}
                  style={{
                    padding: 16, cursor: 'pointer', borderRadius: 'var(--radius-xl)',
                    border: `1.5px solid ${isSelected ? 'var(--color-acc)' : 'var(--color-bdr)'}`,
                    background: isSelected ? 'var(--color-acc-bg)' : 'var(--color-surf)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isSelected ? 'var(--color-acc)' : 'var(--color-surf-2)',
                      color: isSelected ? '#fff' : 'var(--color-t3)',
                      flexShrink: 0,
                    }}>
                      {isSelected
                        ? <Check style={{ width: 20, height: 20 }} />
                        : <SportIcon sport={key} size="md" />
                      }
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: isSelected ? 'var(--color-acc)' : 'var(--color-t1)' }}>
                      {sport.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSports.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--color-t1)' }}>
                Set Your Skill Levels
              </h3>
              {selectedSports.map((sport) => (
                <SkillSlider
                  key={sport}
                  sport={SPORTS[sport]?.name || sport}
                  value={sportLevels[sport] ?? 0}
                  onChange={(value) => setSportLevels((prev) => ({ ...prev, [sport]: value }))}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{
        padding: '16px', borderTop: '1px solid var(--color-bdr)',
        background: 'var(--color-surf)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}>
        <button
          onClick={handleSave}
          disabled={saving || selectedSports.length === 0}
          style={{
            width: '100%', height: 52, borderRadius: 'var(--radius-full)',
            background: (saving || selectedSports.length === 0) ? 'var(--color-surf-2)' : 'var(--color-acc)',
            border: 'none', cursor: (saving || selectedSports.length === 0) ? 'default' : 'pointer',
            color: (saving || selectedSports.length === 0) ? 'var(--color-t3)' : '#fff',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
            boxShadow: (saving || selectedSports.length === 0) ? 'none' : '0 4px 16px rgba(22,212,106,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: (saving || selectedSports.length === 0) ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {saving ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              Saving…
            </>
          ) : 'Save Changes'}
        </button>
      </footer>
    </div>
  );
}

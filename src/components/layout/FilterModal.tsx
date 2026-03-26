import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Slider } from '../ui/slider';
import type { FilterSport, FilterSkill } from '../../types/discover';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: 'sport' | 'distance' | 'skill' | null;
  sport: FilterSport;
  distanceKm: number;
  skill: FilterSkill;
  onSportChange: (v: FilterSport) => void;
  onDistanceChange: (v: number) => void;
  onSkillChange: (v: FilterSkill) => void;
  sports: FilterSport[];
  distances: number[];
  skills: FilterSkill[];
}

const SPORT_LABEL: Record<string, string> = {
  all: 'All sports',
  tennis: 'Tennis',
  padel: 'Padel',
  squash: 'Squash',
  platform_tennis: 'Platform Tennis',
};

const SKILL_LABEL: Record<string, string> = {
  any: 'Any level',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
  professional: 'Professional',
};

export function FilterModal({
  isOpen,
  onClose,
  activeFilter,
  sport,
  distanceKm,
  skill,
  onSportChange,
  onDistanceChange,
  onSkillChange,
  sports,
  distances,
  skills,
}: FilterModalProps) {
  // Continuous miles value for the distance slider (6–50 mi)
  const [distMiles, setDistMiles] = useState(() => Math.round(distanceKm * 0.621));
  // Sync when modal reopens with a different distanceKm
  useEffect(() => { setDistMiles(Math.round(distanceKm * 0.621)); }, [distanceKm]);

  if (!activeFilter) return null;

  const getTitle = () => {
    switch (activeFilter) {
      case 'sport': return 'Select Sport';
      case 'distance': return 'Distance';
      case 'skill': return 'Skill Level';
      default: return '';
    }
  };

  const handleSelect = (value: string | number) => {
    switch (activeFilter) {
      case 'sport':
        onSportChange(value as FilterSport);
        onClose();
        break;
      case 'distance':
        onDistanceChange(value as number);
        break;
      case 'skill':
        onSkillChange(value as FilterSkill);
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxWidth: 430,
              margin: '0 auto',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              background: 'var(--color-surf)',
              border: '1px solid var(--color-bdr)',
              borderBottom: 'none',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <div style={{ width: 48, height: 4, borderRadius: 9999, background: 'var(--color-bdr)' }} />
            </div>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-bdr)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: 'var(--color-t1)',
                  margin: 0,
                }}
              >
                {getTitle()}
              </h3>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  background: 'var(--color-surf-2)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Close"
              >
                <X size={18} style={{ color: 'var(--color-t2)' }} />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {activeFilter === 'sport' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sports.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSelect(s)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        background: sport === s ? 'var(--color-acc)' : 'var(--color-surf-2)',
                        border: sport === s ? '2px solid var(--color-acc)' : '1px solid var(--color-bdr)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-md)',
                        fontWeight: 600,
                        color: sport === s ? '#fff' : 'var(--color-t1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {SPORT_LABEL[s] ?? s}
                    </button>
                  ))}
                </div>
              )}

              {activeFilter === 'distance' && (() => {
                const MIN_MI = 6, MAX_MI = 50;
                const pct = ((distMiles - MIN_MI) / (MAX_MI - MIN_MI)) * 100;
                return (
                  <div style={{ padding: '44px 8px 16px' }}>
                    <div style={{ position: 'relative', marginBottom: 20 }}>
                      {/* Floating bubble */}
                      <div style={{
                        position: 'absolute',
                        left: `${pct}%`,
                        top: -44,
                        transform: 'translateX(-50%)',
                        background: 'var(--color-acc)',
                        color: '#fff',
                        borderRadius: 20,
                        padding: '5px 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}>
                        {distMiles} miles
                        <div style={{
                          position: 'absolute', bottom: -6, left: '50%',
                          transform: 'translateX(-50%)', width: 0, height: 0,
                          borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                          borderTop: '6px solid var(--color-acc)',
                        }} />
                      </div>
                      <Slider
                        min={MIN_MI}
                        max={MAX_MI}
                        step={1}
                        value={[distMiles]}
                        onValueChange={([mi]) => {
                          setDistMiles(mi);
                          onDistanceChange(Math.round(mi / 0.621));
                        }}
                      />
                    </div>
                    {/* Reference labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {distances.map(d => (
                        <span key={d} style={{
                          fontSize: 11, color: 'var(--color-t3)',
                          fontFamily: 'var(--font-body)',
                        }}>
                          {Math.round(d * 0.621)} mi
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activeFilter === 'skill' && (() => {
                const idx = Math.max(0, skills.indexOf(skill));
                const pct = skills.length > 1 ? (idx / (skills.length - 1)) * 100 : 0;
                return (
                  <div style={{ padding: '44px 8px 16px' }}>
                    <div style={{ position: 'relative', marginBottom: 20 }}>
                      {/* Floating bubble */}
                      <div style={{
                        position: 'absolute',
                        left: `clamp(40px, calc(${pct}% - 0px), calc(100% - 40px))`,
                        top: -44,
                        transform: 'translateX(-50%)',
                        background: 'var(--color-acc)',
                        color: '#fff',
                        borderRadius: 20,
                        padding: '5px 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }}>
                        {SKILL_LABEL[skills[idx]] ?? skills[idx]}
                        <div style={{
                          position: 'absolute', bottom: -6, left: '50%',
                          transform: 'translateX(-50%)', width: 0, height: 0,
                          borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                          borderTop: '6px solid var(--color-acc)',
                        }} />
                      </div>
                      <Slider
                        min={0}
                        max={skills.length - 1}
                        step={1}
                        value={[idx]}
                        onValueChange={([i]) => handleSelect(skills[i])}
                      />
                    </div>
                    {/* Tick labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {skills.map(s => (
                        <span key={s} style={{
                          fontSize: 10, color: 'var(--color-t3)',
                          fontFamily: 'var(--font-body)',
                          textTransform: 'capitalize',
                        }}>
                          {s === 'any' ? 'Any' : s.slice(0, 5)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
        break;
      case 'distance':
        onDistanceChange(value as number);
        break;
      case 'skill':
        onSkillChange(value as FilterSkill);
        break;
    }
    onClose();
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

              {activeFilter === 'distance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {distances.map((d) => {
                    const miles = Math.round(d * 0.621);
                    return (
                      <button
                        key={d}
                        onClick={() => handleSelect(d)}
                        style={{
                          padding: '16px 20px',
                          borderRadius: 12,
                          background: distanceKm === d ? 'var(--color-acc)' : 'var(--color-surf-2)',
                          border: distanceKm === d ? '2px solid var(--color-acc)' : '1px solid var(--color-bdr)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-md)',
                          fontWeight: 600,
                          color: distanceKm === d ? '#fff' : 'var(--color-t1)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {miles} miles
                      </button>
                    );
                  })}
                </div>
              )}

              {activeFilter === 'skill' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {skills.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSelect(s)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 12,
                        background: skill === s ? 'var(--color-acc)' : 'var(--color-surf-2)',
                        border: skill === s ? '2px solid var(--color-acc)' : '1px solid var(--color-bdr)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-md)',
                        fontWeight: 600,
                        color: skill === s ? '#fff' : 'var(--color-t1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {SKILL_LABEL[s] ?? s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

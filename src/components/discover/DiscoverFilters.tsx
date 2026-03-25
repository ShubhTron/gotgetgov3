/**
 * DiscoverFilters Component
 *
 * Complete filter interface with chips, bottom sheet sliders, and localStorage persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Target, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'discover_filter_preferences';

interface FilterChipProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ icon: Icon, label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 9999,
        background: active ? 'var(--color-acc)' : 'var(--color-surf)',
        color: active ? '#fff' : 'var(--color-t2)',
        border: `1px solid ${active ? 'var(--color-acc)' : 'var(--color-bdr)'}`,
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

interface DiscoverFiltersProps {
  maxDistance: number;
  skillTolerance: number;
  onDistanceChange: (value: number) => void;
  onSkillToleranceChange: (value: number) => void;
}

interface FilterPreferences {
  maxDistance: number;
  skillTolerance: number;
}

export function DiscoverFilters({
  maxDistance,
  skillTolerance,
  onDistanceChange,
  onSkillToleranceChange,
}: DiscoverFiltersProps) {
  const [activeSheet, setActiveSheet] = useState<'distance' | 'skill' | null>(null);
  const [localDistance, setLocalDistance] = useState(maxDistance);
  const [localSkillTolerance, setLocalSkillTolerance] = useState(skillTolerance);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const preferences: FilterPreferences = JSON.parse(saved);
        onDistanceChange(preferences.maxDistance);
        onSkillToleranceChange(preferences.skillTolerance);
      }
    } catch (error) {
      console.error('Failed to load filter preferences:', error);
    }
  }, []);

  const savePreferences = useCallback((prefs: FilterPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save filter preferences:', error);
    }
  }, []);

  useEffect(() => { setLocalDistance(maxDistance); }, [maxDistance]);
  useEffect(() => { setLocalSkillTolerance(skillTolerance); }, [skillTolerance]);

  const handleDistanceSliderChange = (value: number) => {
    setLocalDistance(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onDistanceChange(value);
      savePreferences({ maxDistance: value, skillTolerance });
    }, 300);
    setDebounceTimer(timer);
  };

  const handleSkillToleranceSliderChange = (value: number) => {
    setLocalSkillTolerance(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onSkillToleranceChange(value);
      savePreferences({ maxDistance, skillTolerance: value });
    }, 300);
    setDebounceTimer(timer);
  };

  const getDistanceLabel = () => {
    if (localDistance === 0) return 'Club only';
    if (localDistance >= 100) return 'Any distance';
    return `Within ${localDistance} mi`;
  };

  const getSkillToleranceLabel = () => {
    if (localSkillTolerance === 0) return 'Same level';
    if (localSkillTolerance === 3) return 'Any skill';
    return `±${localSkillTolerance} level${localSkillTolerance > 1 ? 's' : ''}`;
  };

  return (
    <>
      {/* Filter chips row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <FilterChip
          icon={MapPin}
          label={getDistanceLabel()}
          active={false}
          onClick={() => setActiveSheet('distance')}
        />
        <FilterChip
          icon={Target}
          label={getSkillToleranceLabel()}
          active={false}
          onClick={() => setActiveSheet('skill')}
        />
      </div>

      {/* Bottom sheet */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setActiveSheet(null)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl z-50 max-w-2xl mx-auto"
              style={{
                background: 'var(--color-surf)',
                border: `1px solid var(--color-bdr)`,
                borderBottom: 'none',
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 rounded-full" style={{ background: 'var(--color-bdr)' }} />
              </div>

              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid var(--color-bdr)` }}
              >
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--color-t1)', fontFamily: 'var(--font-display)' }}
                >
                  {activeSheet === 'distance' ? 'Distance' : 'Skill Tolerance'}
                </h3>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="p-2 rounded-full transition-colors"
                  style={{ background: 'var(--color-surf-2)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" style={{ color: 'var(--color-t2)' }} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-8 pb-safe">
                {activeSheet === 'distance' ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-t2)', fontFamily: 'var(--font-body)' }}>
                        {getDistanceLabel()}
                      </span>
                      <span className="text-2xl font-bold" style={{ color: 'var(--color-t1)', fontFamily: 'var(--font-display)' }}>
                        {localDistance === 0 ? '0' : localDistance >= 100 ? '100+' : localDistance}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={localDistance}
                        onChange={(e) => handleDistanceSliderChange(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb-acc"
                        style={{
                          background: `linear-gradient(to right, var(--color-acc) 0%, var(--color-acc) ${localDistance}%, var(--color-surf-2) ${localDistance}%, var(--color-surf-2) 100%)`,
                        }}
                      />
                      <div
                        className="flex justify-between mt-2 text-xs"
                        style={{ color: 'var(--color-t3)', fontFamily: 'var(--font-body)' }}
                      >
                        <span>Club only</span>
                        <span>100+ mi</span>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-t2)', fontFamily: 'var(--font-body)' }}>
                      {localDistance === 0
                        ? 'Show only players at your club'
                        : localDistance >= 100
                        ? 'Show players at any distance'
                        : `Show players within ${localDistance} miles`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-t2)', fontFamily: 'var(--font-body)' }}>
                        {getSkillToleranceLabel()}
                      </span>
                      <span className="text-2xl font-bold" style={{ color: 'var(--color-t1)', fontFamily: 'var(--font-display)' }}>
                        {localSkillTolerance === 3 ? 'Any' : `±${localSkillTolerance}`}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="1"
                        value={localSkillTolerance}
                        onChange={(e) => handleSkillToleranceSliderChange(Number(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb-acc"
                        style={{
                          background: `linear-gradient(to right, var(--color-acc) 0%, var(--color-acc) ${(localSkillTolerance / 3) * 100}%, var(--color-surf-2) ${(localSkillTolerance / 3) * 100}%, var(--color-surf-2) 100%)`,
                        }}
                      />
                      <div
                        className="flex justify-between mt-2 text-xs"
                        style={{ color: 'var(--color-t3)', fontFamily: 'var(--font-body)' }}
                      >
                        <span>Same</span>
                        <span>±1</span>
                        <span>±2</span>
                        <span>Any</span>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-t2)', fontFamily: 'var(--font-body)' }}>
                      {localSkillTolerance === 0
                        ? 'Show only players at your exact skill level'
                        : localSkillTolerance === 3
                        ? 'Show players of any skill level'
                        : `Show players within ${localSkillTolerance} skill level${localSkillTolerance > 1 ? 's' : ''}`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slider thumb styles using CSS var */}
      <style>{`
        .slider-thumb-acc::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-acc);
          cursor: pointer;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--color-acc) 30%, transparent);
          transition: transform 0.2s;
        }
        .slider-thumb-acc::-webkit-slider-thumb:hover { transform: scale(1.1); }
        .slider-thumb-acc::-webkit-slider-thumb:active { transform: scale(0.95); }
        .slider-thumb-acc::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-acc);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--color-acc) 30%, transparent);
          transition: transform 0.2s;
        }
        .slider-thumb-acc::-moz-range-thumb:hover { transform: scale(1.1); }
        .slider-thumb-acc::-moz-range-thumb:active { transform: scale(0.95); }
      `}</style>
    </>
  );
}

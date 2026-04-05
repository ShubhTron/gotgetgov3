import { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import { IconChevronDown } from '../../design-system';
import type { FilterSport, FilterSkill } from '../../types/discover';
import { FilterModal } from './FilterModal';

interface FilterTriptychProps {
  sport: FilterSport;
  distanceKm: number;
  skill: FilterSkill;
  onSportChange: (v: FilterSport) => void;
  onDistanceChange: (v: number) => void;
  onSkillChange: (v: FilterSkill) => void;
}

export interface FilterTriptychHandle {
  openFilter: (filter: 'sport' | 'distance' | 'skill') => void;
}

const SPORT_LABEL: Record<string, string> = {
  all: 'All sports', tennis: 'Tennis', padel: 'Padel',
  squash: 'Squash', platform_tennis: 'Platform Tennis',
};
const SKILL_LABEL: Record<string, string> = {
  any: 'Any level', beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert', professional: 'Professional',
};

function Col({ label, value, onClick, btnRef }: {
  label: string;
  value: string;
  onClick: () => void;
  btnRef?: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 var(--space-5)', cursor: 'pointer',
        background: 'none', border: 'none', textAlign: 'left',
        position: 'relative',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-widest)',
        textTransform: 'uppercase', color: 'var(--color-acc-dk)',
        marginBottom: 'var(--space-1)', display: 'block',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-md)',
        fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)',
        color: 'var(--color-t1)', display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {value}
        <IconChevronDown size={10} style={{ color: 'var(--color-t3)', flexShrink: 0 }} />
      </span>
    </button>
  );
}

export const FilterTriptych = forwardRef<FilterTriptychHandle, FilterTriptychProps>(function FilterTriptych({
  sport, distanceKm, skill,
  onSportChange, onDistanceChange, onSkillChange,
}, ref) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'sport' | 'distance' | 'skill' | null>(null);

  const sportBtnRef = useRef<HTMLButtonElement>(null);
  const distBtnRef  = useRef<HTMLButtonElement>(null);
  const skillBtnRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const SPORTS: FilterSport[] = ['all', 'tennis', 'padel', 'squash'];
  const DISTANCES = [10, 25, 40, 80];
  const SKILLS: FilterSkill[] = ['any', 'beginner', 'intermediate', 'advanced', 'expert'];

  const openFilter = (filter: 'sport' | 'distance' | 'skill') => {
    setActiveFilter(filter);
    setIsModalOpen(true);
    if (filter === 'sport')    setAnchorEl(sportBtnRef.current);
    if (filter === 'distance') setAnchorEl(distBtnRef.current);
    if (filter === 'skill')    setAnchorEl(skillBtnRef.current);
  };

  useImperativeHandle(ref, () => ({ openFilter }));

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveFilter(null);
    setAnchorEl(null);
  };

  const distLabel = `${Math.round(distanceKm * 0.621)} miles`;

  return (
    <>
      <div style={{
        height: 68, flexShrink: 0,
        display: 'flex', alignItems: 'stretch',
        borderTop: '1px solid var(--color-bdr)',
        borderBottom: '1px solid var(--color-bdr)',
        background: 'var(--color-bg)',
        position: 'relative', zIndex: 10,
      }}>
        <Col label="FINDING" value={SPORT_LABEL[sport] ?? sport} onClick={() => openFilter('sport')} btnRef={sportBtnRef} />
        <div style={{ width: 1, background: 'var(--color-bdr)', margin: '14px 0' }} />
        <Col label="WITHIN"  value={distLabel} onClick={() => openFilter('distance')} btnRef={distBtnRef} />
        <div style={{ width: 1, background: 'var(--color-bdr)', margin: '14px 0' }} />
        <Col label="SKILL"   value={SKILL_LABEL[skill] ?? skill} onClick={() => openFilter('skill')} btnRef={skillBtnRef} />
      </div>

      <FilterModal
        isOpen={isModalOpen}
        onClose={closeModal}
        activeFilter={activeFilter}
        sport={sport}
        distanceKm={distanceKm}
        skill={skill}
        onSportChange={onSportChange}
        onDistanceChange={onDistanceChange}
        onSkillChange={onSkillChange}
        sports={SPORTS}
        distances={DISTANCES}
        skills={SKILLS}
        anchorEl={anchorEl}
      />
    </>
  );
});

import React from 'react';
import { IconChevronDown } from '../../design-system';
import type { FilterSport, FilterSkill } from '../../types/discover';

interface FilterTriptychProps {
  sport: FilterSport;
  distanceKm: number;
  skill: FilterSkill;
  onSportChange: (v: FilterSport) => void;
  onDistanceChange: (v: number) => void;
  onSkillChange: (v: FilterSkill) => void;
}

const SPORT_LABEL: Record<string, string> = {
  all: 'All sports', tennis: 'Tennis', padel: 'Padel',
  squash: 'Squash', platform_tennis: 'Platform Tennis',
};
const SKILL_LABEL: Record<string, string> = {
  any: 'Any level', beginner: 'Beginner', intermediate: 'Intermediate',
  advanced: 'Advanced', expert: 'Expert', professional: 'Professional',
};

function Col({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
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

export function FilterTriptych({
  sport, distanceKm, skill,
  onSportChange, onDistanceChange, onSkillChange,
}: FilterTriptychProps) {
  const SPORTS: FilterSport[] = ['all', 'tennis', 'padel', 'squash'];
  const DISTANCES = [10, 25, 40, 80];
  const SKILLS: FilterSkill[] = ['any', 'beginner', 'intermediate', 'advanced', 'expert'];

  const cycleSport = () => {
    const i = SPORTS.indexOf(sport);
    onSportChange(SPORTS[(i + 1) % SPORTS.length]);
  };
  const cycleDistance = () => {
    const i = DISTANCES.indexOf(distanceKm);
    onDistanceChange(DISTANCES[(i + 1) % DISTANCES.length]);
  };
  const cycleSkill = () => {
    const i = SKILLS.indexOf(skill);
    onSkillChange(SKILLS[(i + 1) % SKILLS.length]);
  };

  const distLabel = `${Math.round(distanceKm * 0.621)} miles`;

  return (
    <div style={{
      height: 68, flexShrink: 0,
      display: 'flex', alignItems: 'stretch',
      borderTop: '1px solid var(--color-bdr)',
      borderBottom: '1px solid var(--color-bdr)',
      background: 'var(--color-bg)',
      position: 'relative', zIndex: 10,
    }}>
      <Col label="FINDING" value={SPORT_LABEL[sport] ?? sport} onClick={cycleSport} />
      <div style={{ width: 1, background: 'var(--color-bdr)', margin: '14px 0' }} />
      <Col label="WITHIN"  value={distLabel} onClick={cycleDistance} />
      <div style={{ width: 1, background: 'var(--color-bdr)', margin: '14px 0' }} />
      <Col label="SKILL"   value={SKILL_LABEL[skill] ?? skill} onClick={cycleSkill} />
    </div>
  );
}

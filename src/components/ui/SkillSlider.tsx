import { cn } from '@/lib/utils';

interface SkillSliderProps {
  value: number;
  onChange: (value: number) => void;
  sport: string;
  className?: string;
}

const SKILL_LABELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Professional'];

export function SkillSlider({ value, onChange, sport, className }: SkillSliderProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, color: 'var(--color-t1)' }}>
          {sport}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-acc)' }}>
          {SKILL_LABELS[value]}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="4"
          step="1"
          value={value}
          onChange={handleSliderChange}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-6',
            '[&::-webkit-slider-thumb]:h-6',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:w-6',
            '[&::-moz-range-thumb]:h-6',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:shadow-md',
            '[&::-moz-range-thumb]:cursor-pointer'
          )}
          style={{
            background: `linear-gradient(to right, var(--color-acc) 0%, var(--color-acc) ${(value / 4) * 100}%, var(--color-bdr) ${(value / 4) * 100}%, var(--color-bdr) 100%)`,
          }}
        />
        <div className="flex justify-between mt-2 px-1">
          {SKILL_LABELS.map((label, index) => (
            <div
              key={label}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: index <= value ? 'var(--color-acc)' : 'var(--color-bdr)' }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--color-t3)' }}>
        <span>Beginner</span>
        <span>Professional</span>
      </div>
    </div>
  );
}

export function skillValueToString(value: number): string {
  const mapping = ['beginner', 'intermediate', 'advanced', 'expert', 'professional'];
  return mapping[value] || 'beginner';
}

export function skillStringToValue(str: string): number {
  const mapping: Record<string, number> = {
    'beginner': 0,
    'intermediate': 1,
    'advanced': 2,
    'expert': 3,
    'professional': 4,
  };
  return mapping[str?.toLowerCase?.() ?? ''] ?? 0;
}

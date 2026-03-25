import { Sun, Sunset, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeOfDaySelectProps {
  dayIndex?: number;
  dayLabel: string;
  selectedTimes: string[];
  onChange: (times: string[]) => void;
  className?: string;
}

const timeOptions = [
  { id: 'morning', label: 'Morning', icon: Sun, timeRange: '6am - 12pm' },
  { id: 'afternoon', label: 'Afternoon', icon: Sunset, timeRange: '12pm - 6pm' },
  { id: 'evening', label: 'Evening', icon: Moon, timeRange: '6pm - 10pm' },
];

export function TimeOfDaySelect({ dayLabel, selectedTimes, onChange, className }: TimeOfDaySelectProps) {
  const toggleTime = (timeId: string) => {
    if (selectedTimes.includes(timeId)) {
      onChange(selectedTimes.filter(t => t !== timeId));
    } else {
      onChange([...selectedTimes, timeId]);
    }
  };

  return (
    <div
      className={cn('p-4 rounded-xl', className)}
      style={{ background: 'var(--color-surf)', border: '1px solid var(--color-bdr)' }}
    >
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--color-t1)', marginBottom: 12 }}>
        {dayLabel}
      </p>
      <div className="flex gap-2">
        {timeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedTimes.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleTime(option.id)}
              className="flex-1 py-2 px-3 rounded-lg flex flex-col items-center gap-1 transition-all"
              style={{
                background: isSelected ? 'var(--color-acc)' : 'var(--color-surf-2)',
                color: isSelected ? 'var(--color-bg)' : 'var(--color-t2)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Icon className="w-4 h-4" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

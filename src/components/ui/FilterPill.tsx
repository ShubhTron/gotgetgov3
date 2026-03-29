import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  showCheck?: boolean;
}

export function FilterPill({ label, active, onClick, showCheck = true }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center h-8 px-3 rounded-full text-sm',
        'transition-colors duration-100 whitespace-nowrap',
        active ? 'border-transparent' : ''
      )}
      style={{
        background: active ? 'var(--color-acc)' : 'var(--color-surf-2)',
        color: active ? 'var(--color-bg)' : 'var(--color-t2)',
        border: active ? 'none' : '1px solid var(--color-bdr)',
      }}
    >
      {active && showCheck && <Check className="w-4 h-4 mr-1" />}
      {label}
    </button>
  );
}

interface FilterPillGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterPillGroup({ children, className }: FilterPillGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {children}
    </div>
  );
}

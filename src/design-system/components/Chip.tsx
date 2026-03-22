import React, { type ReactNode } from 'react';

interface ChipProps {
  label: string;
  icon?: ReactNode;
  variant?: 'neutral' | 'accent' | 'danger';
}

const VARIANT: Record<string, React.CSSProperties> = {
  neutral: { background: 'var(--color-surf-2)', border: '1px solid var(--color-bdr)', color: 'var(--color-t2)' },
  accent:  { background: 'var(--color-acc-bg)', border: '1px solid rgba(22,212,106,0.22)', color: 'var(--color-acc-dk)' },
  danger:  { background: 'var(--color-red-bg)', border: '1px solid rgba(232,64,64,0.15)', color: 'var(--color-red)' },
};

export function Chip({ label, icon, variant = 'neutral' }: ChipProps) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      gap: 'var(--space-1)',
      padding: '5px 10px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)' as any,
      whiteSpace: 'nowrap',
      ...VARIANT[variant],
    }}>
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      {label}
    </div>
  );
}

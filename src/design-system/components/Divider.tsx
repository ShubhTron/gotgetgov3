import React from 'react';

interface DividerProps { spacing?: 'sm' | 'md'; }

export function Divider({ spacing = 'md' }: DividerProps) {
  return (
    <div style={{
      height: 1,
      background: 'var(--color-bdr)',
      margin: spacing === 'md' ? 'var(--space-5) 0 0' : 'var(--space-4) 0 0',
    }} />
  );
}

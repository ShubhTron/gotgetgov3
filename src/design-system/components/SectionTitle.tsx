interface SectionTitleProps { children: string; }

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-2xs)',
      fontWeight: 'var(--weight-bold)' as any,
      letterSpacing: 'var(--tracking-widest)',
      textTransform: 'uppercase',
      color: 'var(--color-t3)',
      marginBottom: 'var(--space-3)',
    }}>
      {children}
    </div>
  );
}

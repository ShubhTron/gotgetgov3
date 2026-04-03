import { Skeleton } from '@/components/ui/skeleton';

export function HeroSectionSkeleton() {
  return (
    <section style={{ marginBottom: 24 }}>
      {/* Section header skeleton */}
      <div style={{ marginBottom: 12 }}>
        <Skeleton style={{ height: 20, width: 120, borderRadius: 'var(--radius-sm)' }} />
      </div>
      
      {/* Hero card skeleton */}
      <div
        style={{
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          marginBottom: 8,
        }}
      >
        {/* Header with avatar and name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Skeleton style={{ width: 48, height: 48, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ height: 16, width: 120, marginBottom: 6 }} />
            <Skeleton style={{ height: 14, width: 80 }} />
          </div>
        </div>
        
        {/* Score section */}
        <div style={{ marginBottom: 16 }}>
          <Skeleton style={{ height: 48, width: '100%', borderRadius: 'var(--radius-md)' }} />
        </div>
        
        {/* Match details */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Skeleton style={{ height: 14, width: 100 }} />
          <Skeleton style={{ height: 14, width: 80 }} />
        </div>
      </div>
      
      {/* ELO strip skeleton */}
      <div
        style={{
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: 'var(--radius-md)',
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Skeleton style={{ height: 40, flex: 1 }} />
        <Skeleton style={{ height: 40, width: 80 }} />
      </div>
    </section>
  );
}

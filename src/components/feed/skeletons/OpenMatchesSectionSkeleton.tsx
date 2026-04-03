import { Skeleton } from '@/components/ui/skeleton';

export function OpenMatchesSectionSkeleton() {
  return (
    <section style={{ marginBottom: 24 }}>
      {/* Section header skeleton */}
      <div style={{ marginBottom: 12 }}>
        <Skeleton style={{ height: 20, width: 180, borderRadius: 'var(--radius-sm)' }} />
      </div>
      
      {/* Horizontal scroll container */}
      <div
        style={{
          position: 'relative',
          margin: '0 -16px',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'hidden',
          }}
        >
          {/* Show 3 card skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                minWidth: 240,
                background: 'var(--color-surf)',
                border: '1px solid var(--color-bdr)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
              }}
            >
              {/* Header with avatar and name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ height: 16, width: 100, marginBottom: 6 }} />
                  <Skeleton style={{ height: 14, width: 80 }} />
                </div>
              </div>
              
              {/* Match details */}
              <div style={{ marginBottom: 12 }}>
                <Skeleton style={{ height: 14, width: '90%', marginBottom: 6 }} />
                <Skeleton style={{ height: 14, width: '70%' }} />
              </div>
              
              {/* Action button */}
              <Skeleton style={{ height: 36, width: '100%', borderRadius: 'var(--radius-full)' }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

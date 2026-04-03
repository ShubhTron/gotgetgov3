import { Skeleton } from '@/components/ui/skeleton';

export function DigestSectionSkeleton() {
  return (
    <section style={{ marginBottom: 24 }}>
      {/* Section header skeleton */}
      <div style={{ marginBottom: 12 }}>
        <Skeleton style={{ height: 20, width: 90, borderRadius: 'var(--radius-sm)' }} />
      </div>
      
      {/* Digest card skeleton */}
      <div
        style={{
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Skeleton style={{ height: 18, width: 150, marginBottom: 8 }} />
          <Skeleton style={{ height: 14, width: 200 }} />
        </div>
        
        {/* Match list items (show 3) */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingTop: 12,
              paddingBottom: 12,
              borderTop: i > 1 ? '1px solid var(--color-bdr)' : 'none',
            }}
          >
            <Skeleton style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: 14, width: '70%', marginBottom: 6 }} />
              <Skeleton style={{ height: 12, width: '50%' }} />
            </div>
            <Skeleton style={{ height: 20, width: 40, borderRadius: 'var(--radius-sm)' }} />
          </div>
        ))}
      </div>
    </section>
  );
}

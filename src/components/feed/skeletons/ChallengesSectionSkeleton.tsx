import { Skeleton } from '@/components/ui/skeleton';

export function ChallengesSectionSkeleton() {
  return (
    <section style={{ marginBottom: 24 }}>
      {/* Section header skeleton */}
      <div style={{ marginBottom: 12 }}>
        <Skeleton style={{ height: 20, width: 100, borderRadius: 'var(--radius-sm)' }} />
      </div>
      
      {/* Challenge cards skeleton (show 2 cards) */}
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--color-surf)',
            border: '1px solid var(--color-bdr)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            marginBottom: 12,
          }}
        >
          {/* Header with avatar and name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Skeleton style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: 16, width: 140, marginBottom: 6 }} />
              <Skeleton style={{ height: 14, width: 100 }} />
            </div>
          </div>
          
          {/* Challenge details */}
          <div style={{ marginBottom: 12 }}>
            <Skeleton style={{ height: 14, width: '80%', marginBottom: 6 }} />
            <Skeleton style={{ height: 14, width: '60%' }} />
          </div>
          
          {/* Action button */}
          <Skeleton style={{ height: 36, width: '100%', borderRadius: 'var(--radius-full)' }} />
        </div>
      ))}
    </section>
  );
}

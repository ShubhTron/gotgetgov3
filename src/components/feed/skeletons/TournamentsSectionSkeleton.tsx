import { Skeleton } from '@/components/ui/skeleton';

export function TournamentsSectionSkeleton() {
  return (
    <section style={{ marginBottom: 24 }}>
      {/* Section header skeleton */}
      <div style={{ marginBottom: 12 }}>
        <Skeleton style={{ height: 20, width: 180, borderRadius: 'var(--radius-sm)' }} />
      </div>
      
      {/* Tournament cards skeleton (show 2 cards) */}
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
          {/* Header */}
          <div style={{ marginBottom: 12 }}>
            <Skeleton style={{ height: 18, width: '80%', marginBottom: 8 }} />
            <Skeleton style={{ height: 14, width: '60%' }} />
          </div>
          
          {/* Tournament details */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: 12, width: 60, marginBottom: 6 }} />
              <Skeleton style={{ height: 14, width: 80 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Skeleton style={{ height: 12, width: 60, marginBottom: 6 }} />
              <Skeleton style={{ height: 14, width: 80 }} />
            </div>
          </div>
          
          {/* Action button */}
          <Skeleton style={{ height: 36, width: '100%', borderRadius: 'var(--radius-full)' }} />
        </div>
      ))}
    </section>
  );
}

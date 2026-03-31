import { useState } from 'react';
import { SegmentStrip } from './SegmentStrip';
import type { NewsFilter } from '@/types/feed';

/**
 * Example usage of the SegmentStrip component
 * Demonstrates the horizontal scrollable filter bar with active/inactive states
 */
export function SegmentStripExample() {
  const [activeFilter, setActiveFilter] = useState<NewsFilter>('all');

  return (
    <div style={{ padding: 16, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16, fontFamily: 'var(--font-body)' }}>
        SegmentStrip Component Example
      </h2>
      
      <SegmentStrip 
        activeFilter={activeFilter} 
        onFilterChange={setActiveFilter} 
      />

      <div style={{ marginTop: 24, padding: 16, background: 'var(--color-surf)', borderRadius: 12 }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-t1)' }}>
          Active Filter: <strong>{activeFilter}</strong>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { SegmentedControl, type CirclesSegment } from './SegmentedControl';

/**
 * Example usage of the SegmentedControl component
 * 
 * This demonstrates:
 * - Two segment buttons labeled "MATCHES" and "CIRCLES"
 * - Active/inactive state styling
 * - Click handlers with onSegmentChange callback
 * - Accessibility attributes (ARIA labels, keyboard navigation)
 * - Minimum 44x44pt touch target size
 * - Visual feedback on tap/click
 */
export function SegmentedControlExample() {
  const [activeSegment, setActiveSegment] = useState<CirclesSegment>('MATCHES');

  const handleSegmentChange = (segment: CirclesSegment) => {
    console.log('Segment changed to:', segment);
    setActiveSegment(segment);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <SegmentedControl
        activeSegment={activeSegment}
        onSegmentChange={handleSegmentChange}
      />
      
      <div style={{ padding: 24 }}>
        <h2 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: 24, 
          color: 'var(--color-t1)',
          marginBottom: 16 
        }}>
          Active Segment: {activeSegment}
        </h2>
        
        <div style={{
          background: 'var(--color-surf)',
          border: '1px solid var(--color-bdr)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
        }}>
          <p style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: 14, 
            color: 'var(--color-t2)',
            margin: 0 
          }}>
            {activeSegment === 'MATCHES' 
              ? 'Showing matches feed content (hero match, challenges, open matches, digest, tournaments)'
              : 'Showing circles content (stories, search, match proposals, conversations)'}
          </p>
        </div>
      </div>
    </div>
  );
}

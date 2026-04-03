import React from 'react';

export type CirclesSegment = 'MATCHES' | 'CIRCLES';

export interface SegmentedControlProps {
  activeSegment: CirclesSegment;
  onSegmentChange: (segment: CirclesSegment) => void;
}

export function SegmentedControl({ activeSegment, onSegmentChange }: SegmentedControlProps) {
  const handleSegmentClick = (segment: CirclesSegment) => {
    onSegmentChange(segment);
  };

  const handleKeyDown = (e: React.KeyboardEvent, segment: CirclesSegment) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSegmentChange(segment);
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-bdr)',
        padding: '8px 16px',
        display: 'flex',
        gap: 8,
      }}
    >
      <button
        onClick={() => handleSegmentClick('MATCHES')}
        onKeyDown={(e) => handleKeyDown(e, 'MATCHES')}
        aria-label="View matches feed"
        aria-pressed={activeSegment === 'MATCHES'}
        role="tab"
        tabIndex={0}
        style={{
          flex: 1,
          minHeight: 44,
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: activeSegment === 'MATCHES' ? 'var(--color-tab-on)' : 'var(--color-surf)',
          color: activeSegment === 'MATCHES' ? 'var(--color-surf)' : 'var(--color-tab-off)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        MATCHES
      </button>

      <button
        onClick={() => handleSegmentClick('CIRCLES')}
        onKeyDown={(e) => handleKeyDown(e, 'CIRCLES')}
        aria-label="View circles and social content"
        aria-pressed={activeSegment === 'CIRCLES'}
        role="tab"
        tabIndex={0}
        style={{
          flex: 1,
          minHeight: 44,
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          border: 'none',
          background: activeSegment === 'CIRCLES' ? 'var(--color-tab-on)' : 'var(--color-surf)',
          color: activeSegment === 'CIRCLES' ? 'var(--color-surf)' : 'var(--color-tab-off)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        CIRCLES
      </button>
    </div>
  );
}

import { TrendingUp } from 'lucide-react';

interface ELOStripProps {
  eloChange: number;
  currentElo: number;
  sparklineData: number[];
}

export function ELOStrip({ eloChange, currentElo, sparklineData }: ELOStripProps) {
  // Calculate sparkline dimensions
  const width = 80;
  const height = 32;
  const padding = 2;
  
  // Generate sparkline path
  const generateSparklinePath = (data: number[]): string => {
    if (data.length === 0) return '';
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid division by zero
    
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = generateSparklinePath(sparklineData);
  const isPositive = eloChange >= 0;

  return (
    <div
      style={{
        background: 'var(--color-surf-2)',
        borderRadius: '0 0 18px 18px',
        border: '1px solid var(--color-bdr)',
        borderTop: 'none',
        padding: '14px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left side: Rating change info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-t2)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Rating after today
        </span>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {/* ELO change with indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <TrendingUp
              size={16}
              style={{
                color: isPositive ? 'var(--color-acc)' : 'var(--color-red)',
                transform: isPositive ? 'none' : 'rotate(180deg)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 18,
                fontWeight: 700,
                color: isPositive ? 'var(--color-acc)' : 'var(--color-red)',
              }}
            >
              {isPositive ? '+' : ''}
              {eloChange}
            </span>
          </div>

          {/* Current total rating */}
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--color-t1)',
            }}
          >
            {currentElo}
          </span>
        </div>
      </div>

      {/* Right side: Sparkline chart */}
      {sparklineData.length > 0 && (
        <svg
          width={width}
          height={height}
          style={{
            flexShrink: 0,
          }}
          aria-label="Rating trend sparkline"
        >
          <path
            d={sparklinePath}
            fill="none"
            stroke="var(--color-acc)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

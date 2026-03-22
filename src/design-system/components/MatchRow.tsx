interface MatchRowProps {
  result: 'W' | 'L';
  opponentName: string;
  score: string;
  date: string;
}

export function MatchRow({ result, opponentName, score, date }: MatchRowProps) {
  const isWin = result === 'W';
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: 'var(--space-2)',
      padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--color-bdr)',
    }}>
      {/* W/L circle */}
      <div style={{
        width: 28, height: 28, borderRadius: 'var(--radius-full)', flexShrink: 0,
        background: isWin ? '#16D46A' : 'var(--color-red)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-bold)' as any,
        color: '#fff',
      }}>
        {result}
      </div>

      {/* Opponent name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--weight-semibold)' as any,
          color: 'var(--color-t1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {opponentName}
        </div>
      </div>

      {/* Score + date */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          color: 'var(--color-t1)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {score}
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-t3)',
          marginTop: 2,
        }}>
          {date}
        </div>
      </div>
    </div>
  );
}

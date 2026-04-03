import { ELOStrip } from './ELOStrip';

export default function ELOStripExample() {
  // Sample sparkline data showing rating progression over last 10 matches
  const sparklineData = [1180, 1195, 1188, 1205, 1198, 1210, 1205, 1218, 1212, 1226];

  return (
    <div style={{ maxWidth: 400, margin: '20px auto' }}>
      <h2 style={{ marginBottom: 20 }}>ELO Strip Examples</h2>

      {/* Example 1: Positive ELO change */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Positive Change (+14)</h3>
        <div style={{ background: 'var(--color-t1)', borderRadius: '22px 22px 0 0', padding: 20 }}>
          <p style={{ color: 'white', margin: 0 }}>Hero Card Above</p>
        </div>
        <ELOStrip eloChange={14} currentElo={1226} sparklineData={sparklineData} />
      </div>

      {/* Example 2: Negative ELO change */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Negative Change (-12)</h3>
        <div style={{ background: 'var(--color-t1)', borderRadius: '22px 22px 0 0', padding: 20 }}>
          <p style={{ color: 'white', margin: 0 }}>Hero Card Above</p>
        </div>
        <ELOStrip eloChange={-12} currentElo={1200} sparklineData={[1220, 1215, 1225, 1218, 1230, 1225, 1220, 1215, 1208, 1200]} />
      </div>

      {/* Example 3: Zero change */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>No Change (0)</h3>
        <div style={{ background: 'var(--color-t1)', borderRadius: '22px 22px 0 0', padding: 20 }}>
          <p style={{ color: 'white', margin: 0 }}>Hero Card Above</p>
        </div>
        <ELOStrip eloChange={0} currentElo={1200} sparklineData={[1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200]} />
      </div>

      {/* Example 4: No sparkline data */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>No Sparkline Data</h3>
        <div style={{ background: 'var(--color-t1)', borderRadius: '22px 22px 0 0', padding: 20 }}>
          <p style={{ color: 'white', margin: 0 }}>Hero Card Above</p>
        </div>
        <ELOStrip eloChange={14} currentElo={1226} sparklineData={[]} />
      </div>
    </div>
  );
}

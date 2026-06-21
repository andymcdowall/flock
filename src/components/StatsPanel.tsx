const PANEL_WIDTH = 180;

const ENTITY_COLORS: Record<string, string> = {
  boid: 'rgba(200, 220, 255, 0.85)',
  toid: 'rgba(255, 180, 60, 0.85)',
  foid: 'rgba(80, 200, 100, 0.85)',
  loid: 'rgba(224, 50, 68, 0.85)',
};

const ENTITY_LABELS: Record<string, string> = {
  boid: 'Boids',
  toid: 'Toids',
  foid: 'Foids',
  loid: 'Loids',
};

interface Props {
  counts: Record<string, number>;
  satiations: Record<string, number[]>;
  elapsed: number;
  extinctionTimes: Record<string, number>;
  isOpen: boolean;
  onToggle: () => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function Histogram({ buckets, color }: { buckets: number[]; color: string }) {
  const max = Math.max(...buckets, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 36, marginTop: 6 }}>
      {buckets.map((count, i) => (
        <div
          key={i}
          title={`${i * 10}–${i * 10 + 10}%: ${count}`}
          style={{
            flex: 1,
            height: `${(count / max) * 100}%`,
            minHeight: count > 0 ? 1 : 0,
            background: color,
            opacity: 0.65,
            borderRadius: '1px 1px 0 0',
          }}
        />
      ))}
    </div>
  );
}

export function StatsPanel({ counts, satiations, elapsed, extinctionTimes, isOpen, onToggle }: Props) {
  const kinds = ['boid', 'toid', 'foid', 'loid'];

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={onToggle}
        aria-label="Toggle population stats"
        style={{
          position: 'fixed',
          top: '50%',
          left: isOpen ? PANEL_WIDTH : 0,
          transform: 'translateY(-50%)',
          transition: 'left 0.32s cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(8,8,24,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderLeft: isOpen ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius: '0 8px 8px 0',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: '10px 8px',
          fontSize: 16,
          lineHeight: 1,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 101,
        }}
      >
        {isOpen ? '‹' : '›'}
      </button>

      {/* Slide-out panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: PANEL_WIDTH,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          background: 'rgba(6,6,20,0.94)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          color: 'white',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '24px 20px 0' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', opacity: 0.7 }}>
            Population
          </p>
        </div>

        <div style={{ padding: '24px 20px', flex: 1 }}>
          {kinds.map(kind => {
            const color = ENTITY_COLORS[kind] ?? 'white';
            const buckets = satiations[kind] ?? new Array(10).fill(0);
            return (
              <div key={kind} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {ENTITY_LABELS[kind] ?? kind}
                  </span>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 300,
                    fontVariantNumeric: 'tabular-nums',
                    color: extinctionTimes[kind] !== undefined ? 'rgba(255,255,255,0.2)' : color,
                  }}>
                    {counts[kind] ?? 0}
                  </span>
                </div>
                {extinctionTimes[kind] !== undefined ? (
                  <div style={{ fontSize: 10, opacity: 0.35, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    extinct at {formatTime(extinctionTimes[kind])}
                  </div>
                ) : (counts[kind] ?? 0) > 0 ? (
                  <div style={{ fontSize: 10, opacity: 0.35, marginTop: 3, fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>
                    {formatTime(elapsed)}
                  </div>
                ) : null}
                <Histogram buckets={buckets} color={color} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 9, opacity: 0.25 }}>
                  <span>0%</span>
                  <span>satiation</span>
                  <span>100%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

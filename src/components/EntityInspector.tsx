import type { SelectionInfo } from './FlockingCanvas';

interface Props {
  info: SelectionInfo | null;
  isOpen: boolean;
  onToggle: () => void;
}

const KIND_COLOR: Record<string, string> = {
  boid: '#1e90ff',
  loid: '#e03244',
  toid: '#ffb43c',
  foid: '#50c864',
};

const GENE_LABEL: Record<string, string> = {
  predatorRepulsion: 'predator repulsion',
  preyAttraction:    'prey attraction',
  eatProclivity:     'eat proclivity',
  lifespan:          'lifespan',
  linearVelocity:    'linear velocity',
  angularVelocity:   'angular velocity',
  perceptionRadius:  'perception radius',
  maxForce:          'max force',
  separation:        'separation',
  alignment:         'alignment',
  cohesion:          'cohesion',
  huntingStrategy:   'hunting strategy',
};

function formatGene(name: string, value: number): string {
  if (name === 'eatProclivity') return `${(value * 100).toFixed(0)}%`;
  if (name === 'lifespan') return `${value.toFixed(0)}s`;
  if (name === 'perceptionRadius') return `${value.toFixed(0)}px`;
  if (name === 'angularVelocity' || name === 'maxForce') return value.toFixed(3);
  return value.toFixed(2);
}

function formatDna(dna: string): string {
  return dna.replace(/(.{2})/g, '$1 ').trim();
}

const PANEL_WIDTH = 220;

export function EntityInspector({ info, isOpen, onToggle }: Props) {
  const color = KIND_COLOR[info?.kind ?? ''] ?? 'rgba(255,255,255,0.5)';

  return (
    <>
      <button
        onClick={onToggle}
        aria-label="Toggle inspector"
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
        <div style={{ padding: '24px 16px 0' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', opacity: 0.7 }}>
            Inspector
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!info ? (
            <p style={{ margin: 0, fontSize: 12, opacity: 0.25, lineHeight: 1.6 }}>
              Click an entity to inspect its decoded DNA.
            </p>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <p style={{
                  margin: '0 0 6px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color,
                }}>
                  {info.kind}
                </p>
                <p style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '0.05em',
                  opacity: 0.35,
                  wordBreak: 'break-all',
                }}>
                  {formatDna(info.dna)}
                </p>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  marginBottom: 4,
                  opacity: 0.6,
                }}>
                  <span>satiation</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {(info.satiation * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{
                  height: 3,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${info.satiation * 100}%`,
                    background: color,
                    borderRadius: 2,
                    transition: 'width 0.1s',
                  }} />
                </div>
              </div>

              {(() => {
                const lifespanSecs = info.decoded.lifespan ?? 300;
                const ageSecs = info.age / 60;
                const fraction = Math.min(1, ageSecs / lifespanSecs);
                const r = Math.round(80 + fraction * 175);
                const g = Math.round(200 - fraction * 160);
                const ageColor = `rgb(${r},${g},60)`;
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      marginBottom: 4,
                      opacity: 0.6,
                    }}>
                      <span>age</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {ageSecs.toFixed(0)}s / {lifespanSecs.toFixed(0)}s
                      </span>
                    </div>
                    <div style={{
                      height: 3,
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${fraction * 100}%`,
                        background: ageColor,
                        borderRadius: 2,
                        transition: 'width 0.1s',
                      }} />
                    </div>
                  </div>
                );
              })()}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                {Object.entries(info.decoded).map(([name, value]) => (
                  <div key={name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    marginBottom: 8,
                    gap: 8,
                  }}>
                    <span style={{ opacity: 0.45, flexShrink: 0 }}>
                      {GENE_LABEL[name] ?? name}
                    </span>
                    <span style={{
                      fontVariantNumeric: 'tabular-nums',
                      opacity: 0.85,
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}>
                      {formatGene(name, value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

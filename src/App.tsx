import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlockingCanvas, type FlockingCanvasHandle, type SelectionInfo } from './components/FlockingCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StatsPanel } from './components/StatsPanel';
import { EntityInspector } from './components/EntityInspector';
import { SimControls } from './components/SimControls';
import { DEFAULT_CONFIG } from './types/boid';
import { DEFAULT_TOID_CONFIG } from './types/toid';
import { DEFAULT_FOID_CONFIG } from './types/foid';
import { DEFAULT_LOID_CONFIG } from './types/loid';
import type { FlockConfig } from './types/boid';
import type { ToidConfig } from './types/toid';
import type { FoidConfig } from './types/foid';
import type { LoidConfig } from './types/loid';
import type { EatInteraction } from './types/entity';
import { DEFAULT_WORLD_CONFIG } from './types/world';
import type { WorldConfig } from './types/world';
import { BOID_DEFINITION, encodeBoidDna } from './entities/boid';
import { TOID_DEFINITION, encodeToidDna } from './entities/toid';
import { FOID_DEFINITION } from './entities/foid';
import { LOID_DEFINITION, encodeLoidDna } from './entities/loid';

function loadConfig<T extends object>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}

const INTERACTIONS: EatInteraction[] = [
  { predator: 'boid', prey: 'foid' },
  { predator: 'boid', prey: 'loid' },
  { predator: 'toid', prey: 'boid' },
  { predator: 'toid', prey: 'loid' },
  { predator: 'loid', prey: 'foid' },
];

export default function App() {
  const canvasRef = useRef<FlockingCanvasHandle>(null);
  const [boidConfig, setBoidConfig] = useState<FlockConfig>(() => loadConfig('flock:boid', DEFAULT_CONFIG));
  const [toidConfig, setToidConfig] = useState<ToidConfig>(() => loadConfig('flock:toid', DEFAULT_TOID_CONFIG));
  const [foidConfig, setFoidConfig] = useState<FoidConfig>(() => loadConfig('flock:foid', DEFAULT_FOID_CONFIG));
  const [loidConfig, setLoidConfig] = useState<LoidConfig>(() => loadConfig('flock:loid', DEFAULT_LOID_CONFIG));
  // Counts are snapshotted on Start; all other settings apply immediately
  const [activeBoidCount, setActiveBoidCount] = useState(DEFAULT_CONFIG.count);
  const [activeToidCount, setActiveToidCount] = useState(DEFAULT_TOID_CONFIG.count);
  const [activeFoidMaxCount, setActiveFoidMaxCount] = useState(DEFAULT_FOID_CONFIG.maxCount);
  const [activeLoidCount, setActiveLoidCount] = useState(DEFAULT_LOID_CONFIG.count);

  useEffect(() => { localStorage.setItem('flock:boid', JSON.stringify(boidConfig)); }, [boidConfig]);
  useEffect(() => { localStorage.setItem('flock:toid', JSON.stringify(toidConfig)); }, [toidConfig]);
  useEffect(() => { localStorage.setItem('flock:foid', JSON.stringify(foidConfig)); }, [foidConfig]);
  useEffect(() => { localStorage.setItem('flock:loid', JSON.stringify(loidConfig)); }, [loidConfig]);

  const [worldConfig, setWorldConfig] = useState<WorldConfig>(() => loadConfig('flock:world', DEFAULT_WORLD_CONFIG));

  useEffect(() => { localStorage.setItem('flock:world', JSON.stringify(worldConfig)); }, [worldConfig]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isStatsPanelOpen, setIsStatsPanelOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [entityCounts, setEntityCounts] = useState<Record<string, number>>({});
  const [satiationData, setSatiationData] = useState<Record<string, number[]>>({});
  const [selectedInfo, setSelectedInfo] = useState<SelectionInfo | null>(null);

  // Simulation-time elapsed (ms), scales with speed, pauses when sim pauses
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);

  const handleSimTick = useCallback((totalTicks: number) => {
    const ms = (totalTicks / 60) * 1000;
    elapsedRef.current = ms;
    setElapsedMs(ms);
  }, []);

  // Per-species extinction times (ms elapsed when count hit 0)
  const [extinctionTimes, setExtinctionTimes] = useState<Record<string, number>>({});
  const extinctionTimesRef = useRef<Record<string, number>>({});
  const prevCountsRef = useRef<Record<string, number>>({});

  const handleCounts = useCallback((counts: Record<string, number>) => {
    setEntityCounts(counts);
    const updated = { ...extinctionTimesRef.current };
    let changed = false;
    for (const [id, count] of Object.entries(counts)) {
      if (count === 0 && (prevCountsRef.current[id] ?? 0) > 0 && !(id in updated)) {
        updated[id] = elapsedRef.current;
        changed = true;
      }
    }
    prevCountsRef.current = counts;
    if (changed) {
      extinctionTimesRef.current = updated;
      setExtinctionTimes(updated);
    }
  }, []);

  const handleSatiations = useCallback((data: Record<string, number[]>) => setSatiationData(data), []);
  const handleEntitySelect = useCallback((info: SelectionInfo | null) => {
    setSelectedInfo(info);
    if (info) setIsInspectorOpen(true);
  }, []);

  const boidDna = useMemo(() => encodeBoidDna(boidConfig), [boidConfig]);
  const toidDna = useMemo(() => encodeToidDna(toidConfig), [toidConfig]);
  const loidDna = useMemo(() => encodeLoidDna(loidConfig), [loidConfig]);

  const populations = useMemo(() => [
    {
      definition: BOID_DEFINITION,
      count: activeBoidCount,
      dna: boidDna,
      mitosis: { proclivityPct: boidConfig.mitosisProclivityPct, costPct: boidConfig.mitosisCostPct },
    },
    {
      definition: TOID_DEFINITION,
      count: activeToidCount,
      dna: toidDna,
      mitosis: { proclivityPct: toidConfig.mitosisProclivityPct, costPct: toidConfig.mitosisCostPct },
    },
    {
      definition: FOID_DEFINITION,
      count: activeFoidMaxCount,
      dna: '00000028', // predatorRepulsion=0, preyAttraction=0, eatProclivity=0, lifespan≈120s
      spawnChance: foidConfig.spawnRate / 60,
      mitosis: { proclivityPct: foidConfig.mitosisProclivityPct, costPct: foidConfig.mitosisCostPct },
    },
    {
      definition: LOID_DEFINITION,
      count: activeLoidCount,
      dna: loidDna,
      mitosis: { proclivityPct: loidConfig.mitosisProclivityPct, costPct: loidConfig.mitosisCostPct },
    },
  ], [boidDna, toidDna, loidDna, boidConfig, toidConfig, foidConfig, activeBoidCount, activeToidCount, activeFoidMaxCount, activeLoidCount]);

  const handleStart = () => {
    setActiveBoidCount(boidConfig.count);
    setActiveToidCount(toidConfig.count);
    setActiveFoidMaxCount(foidConfig.maxCount);
    setActiveLoidCount(loidConfig.count);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsPaused(false);
    setSpeed(1);
    setIsPanelOpen(true);
    elapsedRef.current = 0;
    setElapsedMs(0);
    extinctionTimesRef.current = {};
    setExtinctionTimes({});
    prevCountsRef.current = {};
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <FlockingCanvas
        ref={canvasRef}
        populations={populations}
        interactions={INTERACTIONS}
        world={worldConfig}
        isRunning={isRunning}
        isPaused={isPaused}
        speed={speed}
        onCounts={handleCounts}
        onSatiations={handleSatiations}
        onEntitySelect={handleEntitySelect}
        onSimTick={handleSimTick}
      />

      {!isRunning && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: 14,
            fontFamily: 'system-ui,-apple-system,sans-serif',
            letterSpacing: '0.05em',
            margin: 0,
          }}>
            Configure settings and press Start
          </p>
        </div>
      )}

      {isRunning && (
        <SimControls
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(prev => !prev)}
          speed={speed}
          onSpeedChange={v => setSpeed(v)}
          onSpeedDown={() => setSpeed(s => Math.max(0.25, s / 2))}
          onSpeedUp={() => setSpeed(s => Math.min(64, s * 2))}
          elapsed={elapsedMs}
        />
      )}

      <EntityInspector
        info={selectedInfo}
        isOpen={isInspectorOpen}
        onToggle={() => setIsInspectorOpen(prev => !prev)}
      />

      <StatsPanel
        counts={entityCounts}
        satiations={satiationData}
        elapsed={elapsedMs}
        extinctionTimes={extinctionTimes}
        isOpen={isStatsPanelOpen}
        onToggle={() => setIsStatsPanelOpen(prev => !prev)}
      />

      <ControlPanel
        boidConfig={boidConfig}
        onBoidChange={updates => setBoidConfig(prev => ({ ...prev, ...updates }))}
        toidConfig={toidConfig}
        onToidChange={updates => setToidConfig(prev => ({ ...prev, ...updates }))}
        foidConfig={foidConfig}
        onFoidChange={updates => setFoidConfig(prev => ({ ...prev, ...updates }))}
        worldConfig={worldConfig}
        onWorldChange={updates => setWorldConfig(prev => ({ ...prev, ...updates }))}
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(prev => !prev)}
        isRunning={isRunning}
        onStart={handleStart}
        onReset={handleReset}
        onAddBoid={() => canvasRef.current?.addEntities('boid', 5)}
        onAddToid={() => canvasRef.current?.addEntities('toid', 1)}
        onAddFoid={() => canvasRef.current?.addEntities('foid', 5)}
        onAddLoid={() => canvasRef.current?.addEntities('loid', 5)}
        loidConfig={loidConfig}
        onLoidChange={updates => setLoidConfig(prev => ({ ...prev, ...updates }))}
      />
    </div>
  );
}

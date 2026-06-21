import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { EatInteraction, Entity, Population } from '../types/entity';
import type { WorldConfig } from '../types/world';
import { useEntities } from '../hooks/useEntities';

export interface SelectionInfo {
  kind: string;
  dna: string;
  satiation: number;
  age: number;
  decoded: Record<string, number>;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  populations: Population<any>[];
  interactions: EatInteraction[];
  world: WorldConfig;
  isRunning: boolean;
  isPaused?: boolean;
  speed?: number;
  onCounts?: (counts: Record<string, number>) => void;
  onSatiations?: (data: Record<string, number[]>) => void;
  onEntitySelect?: (info: SelectionInfo | null) => void;
  onSimTick?: (totalTicks: number) => void;
}

export interface FlockingCanvasHandle {
  addEntities: (id: string, count: number) => void;
}

export const FlockingCanvas = forwardRef<FlockingCanvasHandle, Props>(
function FlockingCanvas({ populations, interactions, world, isRunning, isPaused = false, speed = 1, onCounts, onSatiations, onEntitySelect, onSimTick }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const populationsRef = useRef(populations);
  const interactionsRef = useRef(interactions);
  const worldRef = useRef(world);
  const isRunningRef = useRef(isRunning);
  const onCountsRef = useRef(onCounts);
  const onSatiationsRef = useRef(onSatiations);
  const onEntitySelectRef = useRef(onEntitySelect);
  const onSimTickRef = useRef(onSimTick);
  const selectedEntityRef = useRef<Entity | null>(null);
  const isPausedRef = useRef(isPaused);
  const speedRef = useRef(speed);
  const { poolRef, defRef, tick, addEntities } = useEntities();

  useImperativeHandle(ref, () => ({
    addEntities: (id, count) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      addEntities(id, count, canvas.width, canvas.height);
    },
  }));

  useEffect(() => { populationsRef.current = populations; }, [populations]);
  useEffect(() => { interactionsRef.current = interactions; }, [interactions]);
  useEffect(() => { worldRef.current = world; }, [world]);
  useEffect(() => { onCountsRef.current = onCounts; }, [onCounts]);
  useEffect(() => { onSatiationsRef.current = onSatiations; }, [onSatiations]);
  useEffect(() => { onEntitySelectRef.current = onEntitySelect; }, [onEntitySelect]);
  useEffect(() => { onSimTickRef.current = onSimTick; }, [onSimTick]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (!isRunning) {
      poolRef.current.clear();
      defRef.current.clear();
    }
  }, [isRunning]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const handleClick = (e: MouseEvent) => {
      if (!isRunningRef.current) return;
      let closest: Entity | null = null;
      let minDist = Infinity;
      for (const pool of poolRef.current.values()) {
        for (const entity of pool) {
          const dx = entity.x - e.offsetX;
          const dy = entity.y - e.offsetY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < entity.radius + 8 && dist < minDist) {
            minDist = dist;
            closest = entity;
          }
        }
      }
      selectedEntityRef.current = closest;
      if (!closest) onEntitySelectRef.current?.(null);
    };
    canvas.addEventListener('click', handleClick);

    let animId: number;
    let frame = 0;
    let tickAccum = 0;

    const loop = () => {
      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(loop);
        return;
      }

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, width, height);

      if (isRunningRef.current) {
        if (!isPausedRef.current) {
          tickAccum += speedRef.current;
          while (tickAccum >= 1) {
            tick(populationsRef.current, interactionsRef.current, worldRef.current, width, height);
            tickAccum -= 1;
            frame++;
          }

          onSimTickRef.current?.(frame);

          if (frame % 6 === 0) {
            if (onCountsRef.current) {
              const counts: Record<string, number> = {};
              for (const [id, pool] of poolRef.current) counts[id] = pool.length;
              onCountsRef.current(counts);
            }
            if (onSatiationsRef.current) {
              const satiations: Record<string, number[]> = {};
              for (const [id, pool] of poolRef.current) {
                const buckets = new Array(10).fill(0);
                for (const e of pool) buckets[Math.min(9, Math.floor(e.satiation * 10))]++;
                satiations[id] = buckets;
              }
              onSatiationsRef.current(satiations);
            }
          }
        }

        for (const [id, pool] of poolRef.current) {
          const def = defRef.current.get(id);
          if (!def) continue;
          for (const entity of pool) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            def.render(ctx, entity as any);
          }
        }

        const selected = selectedEntityRef.current;
        if (selected) {
          const pool = poolRef.current.get(selected.kind);
          if (pool?.includes(selected)) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(selected.x, selected.y, selected.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.restore();

            if (frame % 6 === 0 || isPausedRef.current) {
              const def = defRef.current.get(selected.kind);
              onEntitySelectRef.current?.({
                kind: selected.kind,
                dna: selected.dna,
                satiation: selected.satiation,
                age: selected.age,
                decoded: def?.inspect(selected.dna) ?? {},
              });
            }
          } else {
            selectedEntityRef.current = null;
            onEntitySelectRef.current?.(null);
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
});

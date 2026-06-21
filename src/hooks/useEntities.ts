import { useRef } from 'react';
import type { Entity, EntityDefinition, EatInteraction, Population } from '../types/entity';
import type { WorldConfig } from '../types/world';
import { decodeByte, fromHex } from '../utils/dna';

const DRAIN_PER_SPEED_UNIT = 0.00012; // drain per px/frame of speed
const DRAIN_PER_RADIAN = 0.0008;      // drain per radian of heading change
const MITOSIS_CHANCE_PER_TICK = 0.001;   // ~1 event per 16s per entity when above threshold

function resolveCollisions(entities: Entity[]) {
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      const minDist = a.radius + b.radius;
      if (d2 < minDist * minDist && d2 > 0) {
        const d = Math.sqrt(d2);
        const overlap = (minDist - d) / 2;
        const nx = dx / d;
        const ny = dy / d;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const dvx = b.vx - a.vx;
        const dvy = b.vy - a.vy;
        const impulse = dvx * nx + dvy * ny;
        if (impulse < 0) {
          a.vx += impulse * nx;
          a.vy += impulse * ny;
          b.vx -= impulse * nx;
          b.vy -= impulse * ny;
        }
      }
    }
  }
}

export function useEntities() {
  const poolRef = useRef(new Map<string, Entity[]>());
  const defRef = useRef(new Map<string, EntityDefinition>());
  const dnaRef = useRef(new Map<string, string>());

  function tick(
    populations: Population[],
    interactions: EatInteraction[],
    world: WorldConfig,
    width: number,
    height: number,
  ) {
    // Update definition references
    for (const { definition } of populations) {
      defRef.current.set(definition.id, definition as EntityDefinition);
    }

    // Remove pools whose entity type is no longer active
    const activeIds = new Set(populations.map(p => p.definition.id));
    for (const id of poolRef.current.keys()) {
      if (!activeIds.has(id)) poolRef.current.delete(id);
    }

    // Sync entity counts and DNA
    for (const { definition, count, spawnChance, dna } of populations) {
      const id = definition.id;
      const existing = poolRef.current.get(id);
      const pool = existing ?? [];

      // Propagate DNA changes to all existing entities
      if (dnaRef.current.get(id) !== dna) {
        dnaRef.current.set(id, dna);
        for (const entity of pool) entity.dna = dna;
      }

      if (spawnChance !== undefined) {
        if (pool.length < count && Math.random() < spawnChance) {
          const entity = definition.create(width, height);
          entity.dna = dna;
          pool.push(entity);
        }
      } else if (existing === undefined) {
        while (pool.length < count) {
          const entity = definition.create(width, height);
          entity.dna = dna;
          pool.push(entity);
        }
      }
      poolRef.current.set(id, pool);
    }

    // Collect all entities
    const all: Entity[] = [];
    for (const pool of poolRef.current.values()) all.push(...pool);

    // Run each entity's update + drain satiation by speed and turning
    for (const { definition } of populations) {
      const pool = poolRef.current.get(definition.id) ?? [];
      const def = defRef.current.get(definition.id)!;
      for (const entity of pool) {
        const prevVx = entity.vx;
        const prevVy = entity.vy;
        entity.age++;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        def.update(entity as any, all, width, height);

        const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
        let turnDrain = 0;
        const prevSpeed = Math.sqrt(prevVx * prevVx + prevVy * prevVy);
        if (prevSpeed > 0 && speed > 0) {
          const prevAngle = Math.atan2(prevVy, prevVx);
          const newAngle = Math.atan2(entity.vy, entity.vx);
          let dAngle = Math.abs(newAngle - prevAngle);
          if (dAngle > Math.PI) dAngle = 2 * Math.PI - dAngle;
          turnDrain = dAngle * DRAIN_PER_RADIAN;
        }
        entity.satiation = Math.max(0, entity.satiation - speed * DRAIN_PER_SPEED_UNIT - turnDrain);

        // Old-age death from universal lifespan gene (byte 3)
        const lifespanByte = entity.dna.length >= 8 ? parseInt(entity.dna.slice(6, 8), 16) : 128;
        const lifespanSecs = 30 + (lifespanByte / 255) * 570;
        if (Math.random() < 1 / (lifespanSecs * 60)) entity.satiation = 0;
      }
    }

    // Eating pass — predators eat prey on contact, gated by eatProclivity (universal gene byte 2)
    const eaten = new Set<Entity>();
    for (const { predator, prey } of interactions) {
      const predators = poolRef.current.get(predator) ?? [];
      const preys = poolRef.current.get(prey) ?? [];
      for (const p of predators) {
        if (eaten.has(p)) continue;
        const b = fromHex(p.dna);
        const eatProclivity = decodeByte(b[2] ?? 255, 0, 1);
        if (p.satiation >= eatProclivity) continue;
        for (const f of preys) {
          if (eaten.has(f)) continue;
          const dx = p.x - f.x;
          const dy = p.y - f.y;
          const minDist = p.radius + f.radius;
          if (dx * dx + dy * dy < minDist * minDist) {
            eaten.add(f);
            p.satiation = Math.min(1, p.satiation + f.satiation * world.energyTransfer);
            break;
          }
        }
      }
    }

    // Entities at 0 satiation die
    for (const entity of all) {
      if (entity.satiation <= 0) eaten.add(entity);
    }

    // Remove eaten + starved entities
    for (const [id, pool] of poolRef.current) {
      poolRef.current.set(id, pool.filter(e => !eaten.has(e)));
    }

    // Reproduction pass — per-entity mitosis config
    const newborns: Array<{ id: string; entity: Entity }> = [];

    for (const { definition, mitosis } of populations) {
      if (!mitosis) continue;
      const threshold = mitosis.proclivityPct / 100;
      const cost = mitosis.costPct / 100;
      const pool = poolRef.current.get(definition.id) ?? [];
      for (const entity of pool) {
        if (entity.satiation >= threshold && Math.random() < MITOSIS_CHANCE_PER_TICK) {
          const split = Math.max(0, entity.satiation - cost) / 2;
          entity.satiation = split;
          const child = definition.create(width, height);
          child.dna = entity.dna;
          const angle = Math.random() * Math.PI * 2;
          const offset = entity.radius * 3;
          child.x = ((entity.x + Math.cos(angle) * offset) % width + width) % width;
          child.y = ((entity.y + Math.sin(angle) * offset) % height + height) % height;
          child.satiation = split;
          newborns.push({ id: definition.id, entity: child });
        }
      }
    }

    for (const { id, entity } of newborns) {
      poolRef.current.get(id)?.push(entity);
    }

    // Collision resolution on all survivors + newborns
    const survivors: Entity[] = [];
    for (const pool of poolRef.current.values()) survivors.push(...pool);
    resolveCollisions(survivors);
  }

  function addEntities(definitionId: string, count: number, width: number, height: number) {
    const def = defRef.current.get(definitionId);
    if (!def) return;
    const dna = dnaRef.current.get(definitionId) ?? '';
    const pool = poolRef.current.get(definitionId) ?? [];
    for (let i = 0; i < count; i++) {
      const entity = def.create(width, height);
      entity.dna = dna;
      pool.push(entity);
    }
    poolRef.current.set(definitionId, pool);
  }

  return { poolRef, defRef, tick, addEntities };
}

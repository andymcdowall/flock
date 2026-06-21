import type { Entity } from '../types/entity';

export function limit(vx: number, vy: number, max: number): [number, number] {
  const len = Math.sqrt(vx * vx + vy * vy);
  if (len > max && len > 0) return [(vx / len) * max, (vy / len) * max];
  return [vx, vy];
}

export function normalize(vx: number, vy: number): [number, number] {
  const len = Math.sqrt(vx * vx + vy * vy);
  if (len === 0) return [0, 0];
  return [vx / len, vy / len];
}

export function wrapPosition(entity: Entity, width: number, height: number): void {
  if (entity.x < 0) entity.x += width;
  else if (entity.x > width) entity.x -= width;
  if (entity.y < 0) entity.y += height;
  else if (entity.y > height) entity.y -= height;
}

export function flee(
  entity: Entity, all: readonly Entity[],
  targetKinds: string[], repulsionRadius: number,
  speed: number, maxForce: number,
): [number, number] {
  let rx = 0, ry = 0, count = 0;
  const r2 = repulsionRadius * repulsionRadius;
  for (const other of all) {
    if (!targetKinds.includes(other.kind)) continue;
    const dx = entity.x - other.x;
    const dy = entity.y - other.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < r2 && d2 > 0) {
      const d = Math.sqrt(d2);
      rx += (dx / d) * (repulsionRadius - d) / repulsionRadius;
      ry += (dy / d) * (repulsionRadius - d) / repulsionRadius;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  const [nx, ny] = normalize(rx / count, ry / count);
  return limit(nx * speed - entity.vx, ny * speed - entity.vy, maxForce);
}

export function angleTowardPos(
  entity: Entity, tx: number, ty: number, maxTurnRad: number,
): void {
  const targetAngle = Math.atan2(ty - entity.y, tx - entity.x);
  const currentAngle = Math.atan2(entity.vy, entity.vx);
  let diff = targetAngle - currentAngle;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  const rotation = Math.max(-maxTurnRad, Math.min(maxTurnRad, diff));
  const spd = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
  if (spd === 0) return;
  const newAngle = currentAngle + rotation;
  entity.vx = Math.cos(newAngle) * spd;
  entity.vy = Math.sin(newAngle) * spd;
}

export function angleToward(
  entity: Entity, all: readonly Entity[],
  targetKind: string, perceptionRadius: number, maxTurnRad: number,
): void {
  let cx = 0, cy = 0, count = 0;
  const r2 = perceptionRadius * perceptionRadius;
  for (const other of all) {
    if (other.kind !== targetKind) continue;
    const dx = other.x - entity.x;
    const dy = other.y - entity.y;
    if (dx * dx + dy * dy < r2) {
      cx += other.x;
      cy += other.y;
      count++;
    }
  }
  if (count === 0) return;
  angleTowardPos(entity, cx / count, cy / count, maxTurnRad);
}

export function separate(
  entity: Entity, all: readonly Entity[],
  kind: string, radius: number,
): [number, number] {
  let sx = 0, sy = 0, count = 0;
  const r2 = radius * radius;
  for (const other of all) {
    if (other === entity || other.kind !== kind) continue;
    const dx = entity.x - other.x;
    const dy = entity.y - other.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < r2 && d2 > 0) {
      const d = Math.sqrt(d2);
      sx += dx / d;
      sy += dy / d;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  return [sx / count, sy / count];
}

export function align(
  entity: Entity, all: readonly Entity[],
  kind: string, radius: number, speed: number,
): [number, number] {
  let avx = 0, avy = 0, count = 0;
  const r2 = radius * radius;
  for (const other of all) {
    if (other === entity || other.kind !== kind) continue;
    const dx = other.x - entity.x;
    const dy = other.y - entity.y;
    if (dx * dx + dy * dy < r2) {
      avx += other.vx;
      avy += other.vy;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  const [nx, ny] = normalize(avx / count, avy / count);
  return [nx * speed - entity.vx, ny * speed - entity.vy];
}

export function cohere(
  entity: Entity, all: readonly Entity[],
  kind: string, radius: number, speed: number,
): [number, number] {
  let cx = 0, cy = 0, count = 0;
  const r2 = radius * radius;
  for (const other of all) {
    if (other === entity || other.kind !== kind) continue;
    const dx = other.x - entity.x;
    const dy = other.y - entity.y;
    if (dx * dx + dy * dy < r2) {
      cx += other.x;
      cy += other.y;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  const [nx, ny] = normalize(cx / count - entity.x, cy / count - entity.y);
  return [nx * speed - entity.vx, ny * speed - entity.vy];
}

export function findDenseTarget(
  entity: Entity, all: readonly Entity[],
  targetKinds: string[], perceptionRadius: number, densityRadius: number,
  huntingStrategy: number,
): [number, number] | null {
  const pr2 = perceptionRadius * perceptionRadius;
  const dr2 = densityRadius * densityRadius;

  const visible: Entity[] = [];
  for (const e of all) {
    if (!targetKinds.includes(e.kind)) continue;
    const dx = e.x - entity.x;
    const dy = e.y - entity.y;
    if (dx * dx + dy * dy < pr2) visible.push(e);
  }
  if (visible.length === 0) return null;

  let totalWeight = 0, cx = 0, cy = 0;
  for (const b of visible) {
    let density = 0;
    for (const other of all) {
      if (!targetKinds.includes(other.kind) || other === b) continue;
      const dx = other.x - b.x;
      const dy = other.y - b.y;
      if (dx * dx + dy * dy < dr2) density++;
    }
    const weight = Math.pow(density + 1, huntingStrategy);
    cx += b.x * weight;
    cy += b.y * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? [cx / totalWeight, cy / totalWeight] : null;
}

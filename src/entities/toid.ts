import type { Entity, EntityDefinition } from '../types/entity';
import type { ToidConfig } from '../types/toid';
import { desaturate } from '../utils/color';
import { encodeByte, decodeByte, toHex, fromHex } from '../utils/dna';
import { angleTowardPos, findDenseTarget, wrapPosition } from '../utils/physics';

export interface ToidEntity extends Entity {
  kind: 'toid';
}

const RADIUS = 7;
const PERCEPTION_RADIUS = 200;
const DENSITY_RADIUS = 75;

// DNA layout: [predatorRepulsion][preyAttraction][eatProclivity][lifespan][linearVelocity][angularVelocity][huntingStrategy]
// Ranges:     [0,5] (unused)    [0,5] (unused)  [0,1]          [30,600s] [0.5,10]         [0,0.2]          [-5,5]

interface ToidParams {
  linearVelocity: number;
  angularVelocity: number;
  huntingStrategy: number;
}

function decodeDna(dna: string): ToidParams {
  const b = fromHex(dna);
  return {
    // b[2]: eatProclivity — decoded by useEntities
    // b[3]: lifespan     — decoded by useEntities
    linearVelocity:  decodeByte(b[4] ?? 78,  0.5, 10),
    angularVelocity: decodeByte(b[5] ?? 67,  0, 0.2),
    huntingStrategy: decodeByte(b[6] ?? 215, -5, 5),
  };
}

export function encodeToidDna(config: ToidConfig): string {
  return toHex([
    0,                                               // 0: predatorRepulsion — unexpressed
    0,                                               // 1: preyAttraction — unexpressed
    encodeByte(config.eatProclivityPct / 100, 0, 1), // 2: eatProclivity
    encodeByte(config.lifespanSecs, 30, 600),        // 3: lifespan
    encodeByte(config.speed, 0.5, 10),              // 4: linearVelocity
    encodeByte(config.angularVelocity, 0, 0.2),     // 5: angularVelocity
    encodeByte(config.huntingStrategy, -5, 5),      // 6: huntingStrategy
  ]);
}

function create(width: number, height: number): ToidEntity {
  const angle = Math.random() * Math.PI * 2;
  return {
    kind: 'toid',
    radius: RADIUS,
    satiation: 1,
    x: Math.random() * (width || window.innerWidth),
    y: Math.random() * (height || window.innerHeight),
    vx: Math.cos(angle),
    vy: Math.sin(angle),
    dna: '',
    age: 0,
  };
}

function update(toid: ToidEntity, all: readonly Entity[], width: number, height: number) {
  const p = decodeDna(toid.dna);
  const hunger = 1 - toid.satiation * 0.7;

  const target = findDenseTarget(toid, all, ['boid', 'loid'], PERCEPTION_RADIUS, DENSITY_RADIUS, p.huntingStrategy);
  if (target) {
    angleTowardPos(toid, target[0], target[1], p.angularVelocity * hunger);
  }

  const currentSpeed = Math.sqrt(toid.vx * toid.vx + toid.vy * toid.vy);
  if (currentSpeed > 0) {
    toid.vx = (toid.vx / currentSpeed) * p.linearVelocity;
    toid.vy = (toid.vy / currentSpeed) * p.linearVelocity;
  }

  toid.x += toid.vx;
  toid.y += toid.vy;

  wrapPosition(toid, width, height);
}

function render(ctx: CanvasRenderingContext2D, toid: ToidEntity) {
  const angle = Math.atan2(toid.vy, toid.vx);
  ctx.save();
  ctx.translate(toid.x, toid.y);
  ctx.rotate(angle);
  ctx.fillStyle = desaturate(255, 180, 60, toid.satiation);
  ctx.beginPath();
  ctx.moveTo(RADIUS + 3, 0);
  ctx.lineTo(0, -RADIUS);
  ctx.lineTo(-RADIUS - 3, 0);
  ctx.lineTo(0, RADIUS);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function inspect(dna: string): Record<string, number> {
  const b = fromHex(dna);
  return {
    eatProclivity:   decodeByte(b[2] ?? 230, 0, 1),
    lifespan:        decodeByte(b[3] ?? 128, 30, 600),
    linearVelocity:  decodeByte(b[4] ?? 78,  0.5, 10),
    angularVelocity: decodeByte(b[5] ?? 67,  0, 0.2),
    huntingStrategy: decodeByte(b[6] ?? 215, -5, 5),
  };
}

export const TOID_DEFINITION: EntityDefinition<ToidEntity> = {
  id: 'toid',
  create,
  update,
  render,
  inspect,
};

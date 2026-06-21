import type { Entity, EntityDefinition } from '../types/entity';
import type { LoidConfig } from '../types/loid';
import { desaturate } from '../utils/color';
import { encodeByte, decodeByte, toHex, fromHex } from '../utils/dna';
import { limit, flee, angleToward, wrapPosition } from '../utils/physics';

export interface LoidEntity extends Entity {
  kind: 'loid';
}

const RADIUS = 6;
const HALF_LENGTH = 10;
const HALF_WIDTH = 4;
const PREDATOR_RADIUS = 80;
const FOID_RADIUS = 150;
const MAX_FORCE = 0.1;

// DNA layout: [predatorRepulsion][preyAttraction][eatProclivity][lifespan][linearVelocity][angularVelocity]
// Ranges:     [0,5]             [0,5]            [0,1]          [30,600s] [0.5,10]         [0,0.2]

interface LoidParams {
  predatorRepulsion: number;
  preyAttraction: number;
  linearVelocity: number;
  angularVelocity: number;
}

function decodeDna(dna: string): LoidParams {
  const b = fromHex(dna);
  return {
    predatorRepulsion: decodeByte(b[0] ?? 128, 0, 5),
    preyAttraction:    decodeByte(b[1] ?? 128, 0, 5),
    // b[2]: eatProclivity — decoded by useEntities
    // b[3]: lifespan     — decoded by useEntities
    linearVelocity:    decodeByte(b[4] ?? 78,  0.5, 10),
    angularVelocity:   decodeByte(b[5] ?? 67,  0, 0.2),
  };
}

export function encodeLoidDna(config: LoidConfig): string {
  return toHex([
    encodeByte(config.predatorRepulsion, 0, 5),          // 0: predatorRepulsion
    encodeByte(config.foidAttraction, 0, 5),             // 1: preyAttraction
    encodeByte(config.eatProclivityPct / 100, 0, 1),     // 2: eatProclivity
    encodeByte(config.lifespanSecs, 30, 600),            // 3: lifespan
    encodeByte(config.speed, 0.5, 10),                   // 4: linearVelocity
    encodeByte(config.angularVelocity, 0, 0.2),         // 5: angularVelocity
  ]);
}

function create(width: number, height: number): LoidEntity {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random();
  return {
    kind: 'loid',
    radius: RADIUS,
    satiation: 1,
    x: Math.random() * (width || window.innerWidth),
    y: Math.random() * (height || window.innerHeight),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    dna: '',
    age: 0,
  };
}

function update(loid: LoidEntity, all: readonly Entity[], width: number, height: number) {
  const p = decodeDna(loid.dna);
  const hunger = 1 - loid.satiation * 0.7;

  const [fx, fy] = flee(loid, all, ['boid', 'toid'], PREDATOR_RADIUS, p.linearVelocity, MAX_FORCE);
  loid.vx += fx * p.predatorRepulsion;
  loid.vy += fy * p.predatorRepulsion;

  [loid.vx, loid.vy] = limit(loid.vx, loid.vy, p.linearVelocity);

  const maxTurnRad = p.preyAttraction * p.angularVelocity * hunger;
  angleToward(loid, all, 'foid', FOID_RADIUS, maxTurnRad);

  loid.x += loid.vx;
  loid.y += loid.vy;

  wrapPosition(loid, width, height);
}

function render(ctx: CanvasRenderingContext2D, loid: LoidEntity) {
  const angle = Math.atan2(loid.vy, loid.vx);
  ctx.save();
  ctx.translate(loid.x, loid.y);
  ctx.rotate(angle);
  ctx.fillStyle = desaturate(220, 50, 60, loid.satiation);
  ctx.beginPath();
  ctx.moveTo(HALF_LENGTH, 0);
  ctx.quadraticCurveTo(0, HALF_WIDTH, -HALF_LENGTH, 0);
  ctx.quadraticCurveTo(0, -HALF_WIDTH, HALF_LENGTH, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function inspect(dna: string): Record<string, number> {
  const b = fromHex(dna);
  return {
    predatorRepulsion: decodeByte(b[0] ?? 128, 0, 5),
    preyAttraction:    decodeByte(b[1] ?? 128, 0, 5),
    eatProclivity:     decodeByte(b[2] ?? 230, 0, 1),
    lifespan:          decodeByte(b[3] ?? 128, 30, 600),
    linearVelocity:    decodeByte(b[4] ?? 78,  0.5, 10),
    angularVelocity:   decodeByte(b[5] ?? 67,  0, 0.2),
  };
}

export const LOID_DEFINITION: EntityDefinition<LoidEntity> = {
  id: 'loid',
  create,
  update,
  render,
  inspect,
};

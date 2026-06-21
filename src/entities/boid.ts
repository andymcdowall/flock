import type { Entity, EntityDefinition } from '../types/entity';
import type { FlockConfig } from '../types/boid';
import { desaturate } from '../utils/color';
import { encodeByte, decodeByte, toHex, fromHex } from '../utils/dna';
import { limit, separate, align, cohere, flee, angleToward, wrapPosition } from '../utils/physics';

export interface BoidEntity extends Entity {
  kind: 'boid';
}

const RADIUS = 5;
const LENGTH = 14;
const HALF_WIDTH = 3.5;
const TOID_REPULSION_RADIUS = 80;
const FOID_PERCEPTION_RADIUS = 150;

// DNA layout: [predatorRepulsion][preyAttraction][eatProclivity][lifespan][linearVelocity][angularVelocity]
//             [perceptionRadius][maxForce][separation][alignment][cohesion]
// Ranges:     [0,5]             [0,5]     [0,1]       [30,600s]  [0.5,10]  [0,0.2]
//             [20,200]          [0.01,0.5] [0,5]      [0,5]      [0,5]

interface BoidParams {
  predatorRepulsion: number;
  preyAttraction: number;
  linearVelocity: number;
  angularVelocity: number;
  perceptionRadius: number;
  maxForce: number;
  separation: number;
  alignment: number;
  cohesion: number;
}

function decodeDna(dna: string): BoidParams {
  const b = fromHex(dna);
  return {
    predatorRepulsion: decodeByte(b[0]  ?? 128, 0, 5),
    preyAttraction:    decodeByte(b[1]  ?? 128, 0, 5),
    // b[2]: eatProclivity — decoded by useEntities
    // b[3]: lifespan     — decoded by useEntities
    linearVelocity:    decodeByte(b[4]  ?? 128, 0.5, 10),
    angularVelocity:   decodeByte(b[5]  ?? 67,  0, 0.2),
    perceptionRadius:  decodeByte(b[6]  ?? 70,  20, 200),
    maxForce:          decodeByte(b[7]  ?? 22,  0.01, 0.5),
    separation:        decodeByte(b[8]  ?? 128, 0, 5),
    alignment:         decodeByte(b[9]  ?? 85,  0, 5),
    cohesion:          decodeByte(b[10] ?? 85,  0, 5),
  };
}

export function encodeBoidDna(config: FlockConfig): string {
  return toHex([
    encodeByte(config.toidRepulsion, 0, 5),           // 0: predatorRepulsion
    encodeByte(config.foidAttraction, 0, 5),          // 1: preyAttraction
    encodeByte(config.eatProclivityPct / 100, 0, 1),  // 2: eatProclivity
    encodeByte(config.lifespanSecs, 30, 600),         // 3: lifespan
    encodeByte(config.speed, 0.5, 10),                // 4: linearVelocity
    encodeByte(config.angularVelocity, 0, 0.2),      // 5: angularVelocity
    encodeByte(config.perceptionRadius, 20, 200),     // 6: perceptionRadius
    encodeByte(config.maxForce, 0.01, 0.5),          // 7: maxForce
    encodeByte(config.separation, 0, 5),              // 8: separation
    encodeByte(config.alignment, 0, 5),               // 9: alignment
    encodeByte(config.cohesion, 0, 5),                // 10: cohesion
  ]);
}

function create(width: number, height: number): BoidEntity {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 2;
  return {
    kind: 'boid',
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

function update(boid: BoidEntity, all: readonly Entity[], width: number, height: number) {
  const p = decodeDna(boid.dna);
  const hunger = 1 - boid.satiation * 0.7;
  const sepRadius = p.perceptionRadius * 0.5;

  const [sx, sy] = limit(...separate(boid, all, 'boid', sepRadius), p.maxForce);
  const [ax, ay] = limit(...align(boid, all, 'boid', p.perceptionRadius, p.linearVelocity), p.maxForce);
  const [cx, cy] = limit(...cohere(boid, all, 'boid', p.perceptionRadius, p.linearVelocity), p.maxForce);
  const [fx, fy] = flee(boid, all, ['toid'], TOID_REPULSION_RADIUS, p.linearVelocity, p.maxForce);

  boid.vx += sx * p.separation + ax * p.alignment + cx * p.cohesion + fx * p.predatorRepulsion;
  boid.vy += sy * p.separation + ay * p.alignment + cy * p.cohesion + fy * p.predatorRepulsion;

  [boid.vx, boid.vy] = limit(boid.vx, boid.vy, p.linearVelocity);

  const maxTurnRad = p.preyAttraction * p.angularVelocity * hunger;
  angleToward(boid, all, 'foid', FOID_PERCEPTION_RADIUS, maxTurnRad);

  boid.x += boid.vx;
  boid.y += boid.vy;

  wrapPosition(boid, width, height);
}

function render(ctx: CanvasRenderingContext2D, boid: BoidEntity) {
  const angle = Math.atan2(boid.vy, boid.vx);
  ctx.save();
  ctx.translate(boid.x, boid.y);
  ctx.rotate(angle);
  ctx.fillStyle = desaturate(30, 144, 255, boid.satiation);
  ctx.beginPath();
  ctx.moveTo(LENGTH / 2, 0);
  ctx.lineTo(-LENGTH / 2, -HALF_WIDTH);
  ctx.lineTo(-LENGTH / 2, HALF_WIDTH);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function inspect(dna: string): Record<string, number> {
  const b = fromHex(dna);
  return {
    predatorRepulsion: decodeByte(b[0]  ?? 128, 0, 5),
    preyAttraction:    decodeByte(b[1]  ?? 128, 0, 5),
    eatProclivity:     decodeByte(b[2]  ?? 230, 0, 1),
    lifespan:          decodeByte(b[3]  ?? 128, 30, 600),
    linearVelocity:    decodeByte(b[4]  ?? 128, 0.5, 10),
    angularVelocity:   decodeByte(b[5]  ?? 67,  0, 0.2),
    perceptionRadius:  decodeByte(b[6]  ?? 70,  20, 200),
    maxForce:          decodeByte(b[7]  ?? 22,  0.01, 0.5),
    separation:        decodeByte(b[8]  ?? 128, 0, 5),
    alignment:         decodeByte(b[9]  ?? 85,  0, 5),
    cohesion:          decodeByte(b[10] ?? 85,  0, 5),
  };
}

export const BOID_DEFINITION: EntityDefinition<BoidEntity> = {
  id: 'boid',
  create,
  update,
  render,
  inspect,
};

import type { Entity, EntityDefinition } from '../types/entity';
import { desaturate } from '../utils/color';
import { decodeByte, fromHex } from '../utils/dna';

export interface FoidEntity extends Entity {
  kind: 'foid';
}

const RADIUS = 5;

function create(width: number, height: number): FoidEntity {
  return {
    kind: 'foid',
    radius: RADIUS,
    satiation: 1,
    x: Math.random() * (width || window.innerWidth),
    y: Math.random() * (height || window.innerHeight),
    vx: 0,
    vy: 0,
    dna: '',
    age: 0,
  };
}

function update(_foid: FoidEntity, _all: readonly Entity[], _w: number, _h: number) {
  // foids are stationary; satiation drain and removal handled by the simulation loop
}

function render(ctx: CanvasRenderingContext2D, foid: FoidEntity) {
  ctx.beginPath();
  ctx.arc(foid.x, foid.y, RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = desaturate(80, 200, 100, foid.satiation);
  ctx.fill();
}

function inspect(dna: string): Record<string, number> {
  const b = fromHex(dna);
  return {
    lifespan: decodeByte(b[3] ?? 40, 30, 600),
  };
}

export const FOID_DEFINITION: EntityDefinition<FoidEntity> = {
  id: 'foid',
  create,
  update,
  render,
  inspect,
};

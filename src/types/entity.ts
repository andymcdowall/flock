export interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: string;
  satiation: number;
  dna: string;
  age: number; // ticks alive
}

export interface EntityDefinition<T extends Entity = Entity> {
  id: string;
  create: (width: number, height: number) => T;
  update: (entity: T, all: readonly Entity[], width: number, height: number) => void;
  render: (ctx: CanvasRenderingContext2D, entity: T) => void;
  inspect: (dna: string) => Record<string, number>;
}

export interface MitosisConfig {
  proclivityPct: number;
  costPct: number;
}

export interface Population<T extends Entity = Entity> {
  definition: EntityDefinition<T>;
  count: number;
  dna: string;
  spawnChance?: number; // per-tick probability; when absent, fills instantly
  mitosis?: MitosisConfig;
}

export interface EatInteraction {
  predator: string; // kind that eats
  prey: string;     // kind that gets eaten
}

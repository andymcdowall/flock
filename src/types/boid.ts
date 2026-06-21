export interface FlockConfig {
  count: number;
  separation: number;
  alignment: number;
  cohesion: number;
  perceptionRadius: number;
  speed: number;
  angularVelocity: number;
  maxForce: number;
  toidRepulsion: number;
  foidAttraction: number;
  eatProclivityPct: number;
  lifespanSecs: number;
  mitosisProclivityPct: number;
  mitosisCostPct: number;
}

export const DEFAULT_CONFIG: FlockConfig = {
  count: 80,
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
  perceptionRadius: 75,
  speed: 3,
  angularVelocity: 0.05,
  maxForce: 0.1,
  toidRepulsion: 1.5,
  foidAttraction: 1.5,
  eatProclivityPct: 90,
  lifespanSecs: 300,
  mitosisProclivityPct: 80,
  mitosisCostPct: 20,
};

export interface LoidConfig {
  count: number;
  speed: number;
  angularVelocity: number;
  foidAttraction: number;
  predatorRepulsion: number;
  eatProclivityPct: number;
  lifespanSecs: number;
  mitosisProclivityPct: number;
  mitosisCostPct: number;
}

export const DEFAULT_LOID_CONFIG: LoidConfig = {
  count: 20,
  speed: 2,
  angularVelocity: 0.05,
  foidAttraction: 1.5,
  predatorRepulsion: 1.5,
  eatProclivityPct: 90,
  lifespanSecs: 300,
  mitosisProclivityPct: 80,
  mitosisCostPct: 20,
};

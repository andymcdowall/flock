export interface ToidConfig {
  count: number;
  huntingStrategy: number; // positive → target dense clusters; negative → target isolated prey
  speed: number;
  angularVelocity: number;
  eatProclivityPct: number;
  lifespanSecs: number;
  mitosisProclivityPct: number;
  mitosisCostPct: number;
}

export const DEFAULT_TOID_CONFIG: ToidConfig = {
  count: 5,
  huntingStrategy: 2,
  speed: 2,
  angularVelocity: 0.05,
  eatProclivityPct: 90,
  lifespanSecs: 300,
  mitosisProclivityPct: 80,
  mitosisCostPct: 20,
};

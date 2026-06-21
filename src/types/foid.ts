export interface FoidConfig {
  maxCount: number;
  spawnRate: number; // foids per second
  mitosisProclivityPct: number;
  mitosisCostPct: number;
}

export const DEFAULT_FOID_CONFIG: FoidConfig = {
  maxCount: 30,
  spawnRate: 3,
  mitosisProclivityPct: 80,
  mitosisCostPct: 20,
};

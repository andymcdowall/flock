export interface WorldConfig {
  energyTransfer: number; // fraction of prey's satiation transferred to predator on eat
}

export const DEFAULT_WORLD_CONFIG: WorldConfig = {
  energyTransfer: 0.9,
};

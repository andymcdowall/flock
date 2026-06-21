export interface ReproductionConfig {
  proclivityPct: number; // satiation threshold (0–100) above which mitosis can occur
  costPct: number;       // satiation lost by parent (0–100); child starts with this amount
}

export const DEFAULT_REPRO_CONFIG: ReproductionConfig = {
  proclivityPct: 80,
  costPct: 20,
};

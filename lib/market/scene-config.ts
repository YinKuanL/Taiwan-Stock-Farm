export const sceneConfig = {
  celebrationChangePercent: 1.5,
  celebrationBullPower: 70,
  bearChangePercent: -1,
  panicChangePercent: -2,
  neutralChangeBand: 0.25,
  harvestThresholds: [-0.5, -1, -1.5, -2, -3] as const,
  weatherChangeStep: 0.6,
  breadthWeight: 0.46,
  momentumWeight: 26,
} as const;

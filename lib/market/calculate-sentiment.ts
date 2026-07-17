import { sceneConfig } from "@/lib/market/scene-config";
import type { SentimentResult } from "@/lib/market/types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const level = (value: number) => clamp(Math.round(value), 0, 5) as 0 | 1 | 2 | 3 | 4 | 5;

export function calculateSentiment(input: {
  indexChangePercent: number;
  advancersCount: number;
  declinersCount: number;
  unchangedCount: number;
}): SentimentResult {
  const total = Math.max(input.advancersCount + input.declinersCount + input.unchangedCount, 1);
  const breadth = ((input.advancersCount - input.declinersCount) / total) * 100;
  const momentum = clamp(input.indexChangePercent * sceneConfig.momentumWeight, -72, 72);
  const sentimentScore = Math.round(clamp(momentum + breadth * sceneConfig.breadthWeight, -100, 100));
  const bullPower = Math.round(clamp(50 + sentimentScore * 0.48, 4, 96));
  const bearPower = 100 - bullPower;
  const harvestLevel = sceneConfig.harvestThresholds.reduce<number>((score, threshold) => input.indexChangePercent <= threshold ? score + 1 : score, 0) as 0 | 1 | 2 | 3 | 4 | 5;
  const weatherLevel = level(Math.abs(input.indexChangePercent) / sceneConfig.weatherChangeStep + Math.abs(breadth) / 30);

  let farmMood: SentimentResult["farmMood"] = "neutral";
  if (input.indexChangePercent <= sceneConfig.panicChangePercent || harvestLevel >= 4) farmMood = "panic";
  else if (input.indexChangePercent >= sceneConfig.celebrationChangePercent && bullPower >= sceneConfig.celebrationBullPower) farmMood = "celebration";
  else if (bullPower >= 60) farmMood = "bull";
  else if (bearPower >= 60) farmMood = "bear";

  return { sentimentScore, bullPower, bearPower, harvestLevel, weatherLevel, farmMood };
}

import type { FarmMood, MarketSnapshot } from "@/lib/types/market";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Creates an explicitly fictional market state for the interaction sandbox.
 * It preserves the real market's prices and rankings while translating the
 * selected sentiment into breadth, weather, power and farm-scene signals.
 */
export function createScenarioSnapshot(
  actual: MarketSnapshot,
  sentimentScore: number,
): MarketSnapshot {
  const sentiment = Math.round(clamp(sentimentScore, -100, 100));
  const bullPower = Math.round(clamp(50 + sentiment * 0.46, 4, 96));
  const bearPower = 100 - bullPower;
  const changePercent = Number(clamp(sentiment / 28, -4.2, 4.2).toFixed(2));
  const directionalTotal = Math.max(actual.advancersCount + actual.declinersCount, 800);
  const advancingShare = clamp(0.5 + sentiment / 250, 0.1, 0.9);
  const advancersCount = Math.round(directionalTotal * advancingShare);
  const declinersCount = directionalTotal - advancersCount;

  let harvestLevel = 0;
  if (changePercent <= -0.5) harvestLevel = 1;
  if (changePercent <= -1) harvestLevel = 2;
  if (changePercent <= -2) harvestLevel = 3;
  if (changePercent <= -3.5) harvestLevel = 4;

  let farmMood: FarmMood = "neutral";
  if (sentiment <= -72) farmMood = "panic";
  else if (sentiment <= -24) farmMood = "bear";
  else if (sentiment >= 72) farmMood = "celebration";
  else if (sentiment >= 24) farmMood = "bull";

  return {
    ...actual,
    marketName: "互動情境沙盒｜不影響真實資料",
    taiexChangePercent: changePercent,
    taiexChange: Number((actual.taiexClose * changePercent / 100).toFixed(2)),
    advancersCount,
    declinersCount,
    sentimentScore: sentiment,
    bullPower,
    bearPower,
    harvestLevel,
    weatherLevel: Math.round(clamp(Math.abs(sentiment) / 20, 0, 5)),
    farmMood,
    dataMessage: "情境演練中；所有數值僅用來探索場景反應",
  };
}

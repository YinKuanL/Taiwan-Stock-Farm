export type FarmMood = "celebration" | "bull" | "neutral" | "bear" | "panic";

export type MarketDataStatus = "live" | "delayed" | "cached" | "demo" | "unavailable";

export interface StockMover {
  code: string;
  name: string;
  price: number | null;
  change: number;
  changePercent: number;
}

export interface MarketSnapshot {
  marketName: string;
  tradingDate: string;
  lastUpdated: string;
  status: MarketDataStatus;
  indexValue: number | null;
  indexChange: number;
  indexChangePercent: number;
  advancersCount: number;
  declinersCount: number;
  unchangedCount: number;
  turnover: number | null;
  volume: number | null;
  topGainers: StockMover[];
  topLosers: StockMover[];
  sentimentScore: number;
  bullPower: number;
  bearPower: number;
  harvestLevel: 0 | 1 | 2 | 3 | 4 | 5;
  weatherLevel: 0 | 1 | 2 | 3 | 4 | 5;
  farmMood: FarmMood;
  narration: string;
  sourceName: string;
  sourceNote: string;
}

export interface SentimentResult {
  sentimentScore: number;
  bullPower: number;
  bearPower: number;
  harvestLevel: MarketSnapshot["harvestLevel"];
  weatherLevel: MarketSnapshot["weatherLevel"];
  farmMood: FarmMood;
}

export interface FarmSceneState {
  sky: "sunny" | "mixed" | "cloudy" | "storm" | "golden";
  crops: "growing" | "steady" | "bent" | "harvest" | "ripe";
  animalActivity: "high" | "normal" | "watching" | "sheltering";
  windIntensity: 0 | 1 | 2 | 3 | 4 | 5;
  showHarvester: boolean;
  showCelebration: boolean;
  showCrows: boolean;
  label: string;
}

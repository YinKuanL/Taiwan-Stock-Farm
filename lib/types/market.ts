export type FarmMood = "bull" | "bear" | "neutral" | "panic" | "celebration";

export type DataMode = "live" | "demo";
export type MarketPhase = "preopen" | "open" | "closed";

export interface RealtimeIndexQuote {
  date: string;
  time: string;
  value: number;
  previousClose: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  phase: MarketPhase;
  refreshAfterMs: number;
  sourceTimestamp: string;
}

export interface MarketMover {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface MarketSnapshot {
  marketName: string;
  date: string;
  lastUpdated: string;
  taiexClose: number;
  taiexChange: number;
  taiexChangePercent: number;
  advancersCount: number;
  declinersCount: number;
  unchangedCount: number;
  volume: number;
  turnover: number;
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  sentimentScore: number;
  bullPower: number;
  bearPower: number;
  harvestLevel: number;
  weatherLevel: number;
  farmMood: FarmMood;
  dataMode: DataMode;
  dataMessage: string;
  quotePhase?: MarketPhase;
  quoteTime?: string;
  quoteRefreshAfterMs?: number;
  productStatus?: "live" | "delayed" | "cached" | "demo" | "unavailable";
}

export interface SceneState {
  sky: "sunny" | "cloudy" | "storm" | "golden";
  cropState: "growing" | "steady" | "bent" | "harvest";
  windSpeed: number;
  showHarvester: boolean;
  showCelebration: boolean;
  battleLine: number;
  label: string;
  weatherLabel: string;
  advice: string;
}

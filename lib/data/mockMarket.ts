import type { MarketMover } from "@/lib/types/market";
import { deriveSnapshot } from "@/lib/data/transformers";

const gainers: MarketMover[] = [
  { code: "2454", name: "聯發科", price: 1535, change: 95, changePercent: 6.6, volume: 18642000 },
  { code: "2382", name: "廣達", price: 318.5, change: 17.5, changePercent: 5.81, volume: 52117000 },
  { code: "1519", name: "華城", price: 743, change: 38, changePercent: 5.39, volume: 7391000 },
  { code: "3017", name: "奇鋐", price: 1210, change: 58, changePercent: 5.03, volume: 9840000 },
  { code: "2308", name: "台達電", price: 546, change: 23, changePercent: 4.4, volume: 12203000 },
];

const losers: MarketMover[] = [
  { code: "2603", name: "長榮", price: 204, change: -13, changePercent: -5.99, volume: 61123000 },
  { code: "2618", name: "長榮航", price: 34.1, change: -1.75, changePercent: -4.88, volume: 73302000 },
  { code: "2884", name: "玉山金", price: 31.25, change: -1.35, changePercent: -4.14, volume: 84217000 },
  { code: "1101", name: "台泥", price: 31.9, change: -1.25, changePercent: -3.77, volume: 30211000 },
  { code: "2357", name: "華碩", price: 612, change: -22, changePercent: -3.47, volume: 7720000 },
];

export const mockMarket = deriveSnapshot(
  {
    marketName: "臺灣證券交易所｜示範戰局",
    date: new Date().toISOString().slice(0, 10),
    taiexClose: 22984.62,
    taiexChange: -378.16,
    taiexChangePercent: -1.62,
    advancersCount: 286,
    declinersCount: 641,
    unchangedCount: 92,
    volume: 5_873_000_000,
    turnover: 468_200_000_000,
    topGainers: gainers,
    topLosers: losers,
  },
  "demo",
);


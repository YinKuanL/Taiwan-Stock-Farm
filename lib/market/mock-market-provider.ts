import { normalizeMarketData } from "@/lib/market/normalize-market-data";
import { DEMO_LAST_UPDATED, DEMO_TRADING_DATE } from "@/lib/market/demo-constants";
import type { MarketSnapshot } from "@/lib/market/types";

export function getMockMarketSnapshot(): MarketSnapshot {
  return normalizeMarketData({
    marketName: "臺灣證券交易所｜示範戰場",
    tradingDate: DEMO_TRADING_DATE,
    lastUpdated: DEMO_LAST_UPDATED,
    status: "demo",
    indexValue: 22984.62,
    indexChange: -378.16,
    indexChangePercent: -1.62,
    advancersCount: 286,
    declinersCount: 641,
    unchangedCount: 92,
    turnover: 391_280_000_000,
    volume: 5_830_000_000,
    topGainers: [
      { code: "2330", name: "台積電", price: 1035, change: 35, changePercent: 3.5 },
      { code: "2454", name: "聯發科", price: 1480, change: 45, changePercent: 3.14 },
    ],
    topLosers: [
      { code: "2603", name: "長榮", price: 202, change: -13, changePercent: -6.05 },
      { code: "2882", name: "國泰金", price: 67.5, change: -2.3, changePercent: -3.3 },
    ],
    sourceName: "Deterministic demo data",
    sourceNote: "農場通訊暫時中斷，目前清楚標示為示範戰役",
  });
}

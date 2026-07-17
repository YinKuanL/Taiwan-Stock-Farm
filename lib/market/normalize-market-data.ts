import { calculateSentiment } from "@/lib/market/calculate-sentiment";
import { generateNarration } from "@/lib/market/generate-narration";
import type { MarketDataStatus, MarketSnapshot, StockMover } from "@/lib/market/types";
import type { MarketSnapshot as LegacyMarketSnapshot } from "@/lib/types/market";

const statuses = new Set<MarketDataStatus>(["live", "delayed", "cached", "demo", "unavailable"]);
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const finite = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const nullableFinite = (value: unknown) => value === null || value === undefined || value === "" ? null : finite(value, 0);
const count = (value: unknown) => Math.max(0, Math.round(finite(value)));
const text = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim() : fallback;
const isoDate = (value: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) ? String(value) : new Date().toISOString().slice(0, 10);
const isoTimestamp = (value: unknown) => {
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const movers = (value: unknown): StockMover[] => Array.isArray(value)
  ? value.slice(0, 5).map((item) => {
      const row = record(item);
      return {
        code: text(row.code, "—").slice(0, 12),
        name: text(row.name, "未知作物").slice(0, 30),
        price: nullableFinite(row.price),
        change: finite(row.change),
        changePercent: finite(row.changePercent),
      };
    })
  : [];

export function normalizeMarketData(input: unknown): MarketSnapshot {
  const row = record(input);
  const status = statuses.has(row.status as MarketDataStatus) ? row.status as MarketDataStatus : "unavailable";
  const tradingDate = isoDate(row.tradingDate);
  const base = {
    marketName: text(row.marketName, "臺灣證券交易所｜上市市場"),
    tradingDate,
    lastUpdated: isoTimestamp(row.lastUpdated),
    status,
    indexValue: nullableFinite(row.indexValue),
    indexChange: finite(row.indexChange),
    indexChangePercent: finite(row.indexChangePercent),
    advancersCount: count(row.advancersCount),
    declinersCount: count(row.declinersCount),
    unchangedCount: count(row.unchangedCount),
    turnover: nullableFinite(row.turnover),
    volume: nullableFinite(row.volume),
    topGainers: movers(row.topGainers),
    topLosers: movers(row.topLosers),
    sourceName: text(row.sourceName, "Farm Market Battle"),
    sourceNote: text(row.sourceNote, "市場資料目前無法更新"),
  };
  const sentiment = calculateSentiment(base);
  const snapshot = { ...base, ...sentiment } as MarketSnapshot;
  return {
    ...snapshot,
    narration: text(row.narration, generateNarration(snapshot)),
  };
}

export function toLegacyMarketSnapshot(snapshot: MarketSnapshot): LegacyMarketSnapshot {
  const dataMode = snapshot.status === "demo" || snapshot.status === "unavailable" ? "demo" : "live";
  const quotePhase = snapshot.status === "live" ? "open" : snapshot.status === "delayed" || snapshot.status === "cached" ? "closed" : undefined;
  const quoteTime = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(snapshot.lastUpdated));
  return {
    marketName: snapshot.marketName,
    date: snapshot.tradingDate,
    lastUpdated: snapshot.lastUpdated,
    taiexClose: snapshot.indexValue ?? 0,
    taiexChange: snapshot.indexChange,
    taiexChangePercent: snapshot.indexChangePercent,
    advancersCount: snapshot.advancersCount,
    declinersCount: snapshot.declinersCount,
    unchangedCount: snapshot.unchangedCount,
    volume: snapshot.volume ?? 0,
    turnover: snapshot.turnover ?? 0,
    topGainers: snapshot.topGainers.map((item) => ({ ...item, price: item.price ?? 0, volume: 0 })),
    topLosers: snapshot.topLosers.map((item) => ({ ...item, price: item.price ?? 0, volume: 0 })),
    sentimentScore: snapshot.sentimentScore,
    bullPower: snapshot.bullPower,
    bearPower: snapshot.bearPower,
    harvestLevel: snapshot.harvestLevel,
    weatherLevel: snapshot.weatherLevel,
    farmMood: snapshot.farmMood,
    dataMode,
    dataMessage: `${snapshot.sourceName}｜${snapshot.sourceNote}`,
    quotePhase,
    quoteTime,
    quoteRefreshAfterMs: snapshot.status === "live" ? 5000 : 60000,
    productStatus: snapshot.status,
  };
}

export function toProductMarketSnapshot(snapshot: LegacyMarketSnapshot): MarketSnapshot {
  const status = snapshot.productStatus ?? (snapshot.dataMode === "demo" ? "demo" : snapshot.quotePhase === "open" ? "live" : "delayed");
  return normalizeMarketData({
    marketName: snapshot.marketName,
    tradingDate: snapshot.date,
    lastUpdated: snapshot.lastUpdated,
    status,
    indexValue: snapshot.taiexClose,
    indexChange: snapshot.taiexChange,
    indexChangePercent: snapshot.taiexChangePercent,
    advancersCount: snapshot.advancersCount,
    declinersCount: snapshot.declinersCount,
    unchangedCount: snapshot.unchangedCount,
    turnover: snapshot.turnover,
    volume: snapshot.volume,
    topGainers: snapshot.topGainers,
    topLosers: snapshot.topLosers,
    sourceName: snapshot.quotePhase ? "TWSE MIS／證交所 OpenAPI" : "臺灣證券交易所 OpenAPI",
    sourceNote: snapshot.dataMessage,
  });
}

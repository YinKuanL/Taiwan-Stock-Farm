import { mockMarket } from "@/lib/data/mockMarket";
import { getRealtimeIndexQuote, mergeRealtimeQuote } from "@/lib/data/realtimeAdapter";
import { transformTwseData } from "@/lib/data/transformers";
import type { MarketSnapshot } from "@/lib/types/market";

const TWSE_BASE_URL = "https://openapi.twse.com.tw/v1";

async function fetchTwseEndpoint<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${TWSE_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`TWSE request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const [indexRows, stockRows, realtimeQuote] = await Promise.all([
      fetchTwseEndpoint<Record<string, string>[]>("/exchangeReport/MI_INDEX", controller.signal),
      fetchTwseEndpoint<Record<string, string>[]>("/exchangeReport/STOCK_DAY_ALL", controller.signal),
      getRealtimeIndexQuote().catch(() => null),
    ]);
    const snapshot = transformTwseData(indexRows, stockRows);
    return realtimeQuote ? mergeRealtimeQuote(snapshot, realtimeQuote) : snapshot;
  } catch (error) {
    console.warn("Using demo market snapshot:", error);
    return mockMarket;
  } finally {
    clearTimeout(timeout);
  }
}

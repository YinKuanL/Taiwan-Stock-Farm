import { getMockMarketSnapshot } from "@/lib/market/mock-market-provider";
import { normalizeMarketData } from "@/lib/market/normalize-market-data";
import { getPublicMarketSnapshot } from "@/lib/market/public-market-provider";
import type { MarketSnapshot } from "@/lib/market/types";

const MARKET_TIMEOUT_MS = 9000;
let lastSuccessfulSnapshot: MarketSnapshot | null = null;

export async function resolveMarketSnapshot(
  loader: () => Promise<MarketSnapshot> = getPublicMarketSnapshot,
): Promise<MarketSnapshot> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      loader(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Market provider timeout")), MARKET_TIMEOUT_MS);
      }),
    ]);
    const normalized = normalizeMarketData(result);
    if (normalized.status === "live" || normalized.status === "delayed") lastSuccessfulSnapshot = normalized;
    if (normalized.status === "demo" && lastSuccessfulSnapshot) {
      return normalizeMarketData({ ...lastSuccessfulSnapshot, status: "cached", sourceNote: "外部行情暫時中斷，顯示本次服務最後成功快照" });
    }
    return normalized;
  } catch {
    if (lastSuccessfulSnapshot) {
      return normalizeMarketData({ ...lastSuccessfulSnapshot, status: "cached", sourceNote: "外部行情逾時，顯示本次服務最後成功快照" });
    }
    return getMockMarketSnapshot();
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  return resolveMarketSnapshot();
}

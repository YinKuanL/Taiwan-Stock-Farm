import { getMarketSnapshot as getLegacySnapshot } from "@/lib/data/marketAdapter";
import { toProductMarketSnapshot } from "@/lib/market/normalize-market-data";
import type { MarketSnapshot } from "@/lib/market/types";

export async function getPublicMarketSnapshot(): Promise<MarketSnapshot> {
  const snapshot = await getLegacySnapshot();
  return toProductMarketSnapshot(snapshot);
}

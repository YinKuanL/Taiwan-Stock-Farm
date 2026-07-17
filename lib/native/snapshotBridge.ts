import type { MarketSnapshot } from "@/lib/market/types";

interface MarketSnapshotNativePlugin {
  saveSnapshot(options: { snapshot: string }): Promise<{ saved: boolean }>;
}

let lastNativeSync = 0;
let lastFingerprint = "";

export async function syncSnapshotToNative(snapshot: MarketSnapshot): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { Capacitor, registerPlugin } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return false;
  const MarketSnapshotNative = registerPlugin<MarketSnapshotNativePlugin>("MarketSnapshot");
  const fingerprint = [snapshot.tradingDate, snapshot.status, snapshot.indexValue, snapshot.farmMood, snapshot.harvestLevel].join("|");
  const now = Date.now();
  if (fingerprint === lastFingerprint || now - lastNativeSync < 60_000) return false;
  try {
    const result = await MarketSnapshotNative.saveSnapshot({ snapshot: JSON.stringify(snapshot) });
    if (result.saved) {
      lastNativeSync = now;
      lastFingerprint = fingerprint;
    }
    return result.saved;
  } catch {
    return false;
  }
}

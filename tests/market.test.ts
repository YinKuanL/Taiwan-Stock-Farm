import assert from "node:assert/strict";
import test from "node:test";
import { calculateScene } from "../lib/market/calculate-scene";
import { calculateSentiment } from "../lib/market/calculate-sentiment";
import { generateNarration } from "../lib/market/generate-narration";
import { resolveMarketSnapshot } from "../lib/market/market-provider";
import { normalizeMarketData } from "../lib/market/normalize-market-data";
import type { MarketSnapshot } from "../lib/market/types";

const cases = [
  { label: "大漲", change: 2.4, up: 800, down: 140, moods: ["celebration", "bull"] },
  { label: "小漲", change: 0.7, up: 620, down: 330, moods: ["bull"] },
  { label: "盤整", change: 0.02, up: 490, down: 480, moods: ["neutral"] },
  { label: "小跌", change: -0.7, up: 340, down: 610, moods: ["bear"] },
  { label: "大跌", change: -3.1, up: 120, down: 850, moods: ["panic"] },
] as const;

for (const scenario of cases) {
  test(`sentiment calculation: ${scenario.label}`, () => {
    const result = calculateSentiment({ indexChangePercent: scenario.change, advancersCount: scenario.up, declinersCount: scenario.down, unchangedCount: 80 });
    assert.equal(result.bullPower + result.bearPower, 100);
    assert.ok(result.sentimentScore >= -100 && result.sentimentScore <= 100);
    assert.ok(scenario.moods.includes(result.farmMood as never));
  });
}

test("normalizes incomplete and unsafe provider fields", () => {
  const snapshot = normalizeMarketData({
    tradingDate: "bad-date",
    status: "not-a-status",
    indexValue: "not-a-number",
    advancersCount: -9,
    topGainers: [{ code: "2330", name: "台積電", price: null, change: "25", changePercent: "1.2" }],
  });
  assert.equal(snapshot.status, "unavailable");
  assert.equal(snapshot.indexValue, 0);
  assert.equal(snapshot.advancersCount, 0);
  assert.equal(snapshot.topGainers[0]?.price, null);
  assert.equal(snapshot.topGainers[0]?.change, 25);
});

test("panic scene activates the safe harvester and storm", () => {
  const snapshot = normalizeMarketData({ tradingDate: "2026-07-17", status: "demo", indexChangePercent: -3, advancersCount: 100, declinersCount: 900 });
  const scene = calculateScene(snapshot);
  assert.equal(scene.showHarvester, true);
  assert.equal(scene.sky, "storm");
  assert.equal(scene.crops, "harvest");
});

test("narration is deterministic but varies by trading date", () => {
  const first = generateNarration({ farmMood: "neutral", tradingDate: "2026-07-17" });
  const repeated = generateNarration({ farmMood: "neutral", tradingDate: "2026-07-17" });
  const next = generateNarration({ farmMood: "neutral", tradingDate: "2026-07-18" });
  assert.equal(first, repeated);
  assert.notEqual(first, next);
});

test("provider failure returns an explicitly labelled deterministic demo", async () => {
  const snapshot = await resolveMarketSnapshot(async () => { throw new Error("network down"); });
  assert.equal(snapshot.status, "demo");
  assert.match(snapshot.sourceName, /demo/i);
  assert.ok(snapshot.narration.length > 20);
});

test("scene calculation accepts a complete canonical snapshot", () => {
  const snapshot = normalizeMarketData({ tradingDate: "2026-07-17", status: "live", indexChangePercent: 1.8, advancersCount: 760, declinersCount: 180 }) as MarketSnapshot;
  assert.ok(["golden", "sunny"].includes(calculateScene(snapshot).sky));
});

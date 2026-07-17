import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Farm Market Battle product", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Farm Market Battle｜台股農場戰場<\/title>/i);
  assert.match(html, /把台股多空/);
  assert.match(html, /今日農場戰況/);
  assert.match(html, /Bull Power/i);
  assert.match(html, /玩玩風向/);
  assert.match(html, /分享戰況/);
  assert.match(html, /查詢個股財報/);
  assert.match(html, /搜尋上市公司/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("battle deep-link route renders the complete farm product", async () => {
  const response = await render("/battle");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /今日農場戰況/);
  assert.match(html, /場景探索進度/);
  assert.match(html, /今日作物榜/);
});

test("market API returns the canonical validated snapshot", async () => {
  const response = await render("/api/market");
  assert.equal(response.status, 200);
  const snapshot = await response.json();
  assert.equal(typeof snapshot.marketName, "string");
  assert.equal(typeof snapshot.tradingDate, "string");
  assert.ok(["live", "delayed", "cached", "demo", "unavailable"].includes(snapshot.status));
  assert.equal(snapshot.bullPower + snapshot.bearPower, 100);
  assert.equal(typeof snapshot.narration, "string");
  assert.equal(typeof snapshot.sourceName, "string");
});

test("PWA manifest and offline route are available", async () => {
  const manifestResponse = await render("/manifest.webmanifest");
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "/");
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/battle"));

  const offlineResponse = await render("/offline");
  assert.equal(offlineResponse.status, 200);
  assert.match(await offlineResponse.text(), /農場通訊暫時中斷/);
});

test("ships the market data architecture and removes the disposable preview", async () => {
  const [packageJson, route, transformer, sceneRules, narration, scenario, stockRoute, financialRoute, researchAdapter] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/api/market/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/data/transformers.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/data/sceneRules.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/data/narration.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/data/scenario.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/stocks/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/financials/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/data/researchAdapter.ts", import.meta.url), "utf8"),
  ]);

  assert.match(packageJson, /"framer-motion"/);
  assert.match(packageJson, /"recharts"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(route, /getMarketSnapshot/);
  assert.match(transformer, /harvestLevel/);
  assert.match(sceneRules, /showHarvester/);
  assert.match(narration, /farmMood/);
  assert.match(scenario, /createScenarioSnapshot/);
  assert.match(scenario, /不影響真實資料/);
  assert.match(stockRoute, /searchListedStocks/);
  assert.match(financialRoute, /getFinancialReport/);
  assert.match(researchAdapter, /t187ap06_L_ci/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../app/battle/page.tsx", import.meta.url));
  await access(new URL("../app/manifest.ts", import.meta.url));
  await access(new URL("../public/sw.js", import.meta.url));
  await access(new URL("../capacitor.config.ts", import.meta.url));
  await access(new URL("../ios-native/Widget/FarmMarketWidget.swift", import.meta.url));
  await access(projectRoot);
});

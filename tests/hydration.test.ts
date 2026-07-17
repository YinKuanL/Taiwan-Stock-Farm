import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FarmMarketBattle from "../components/FarmMarketBattle";
import { getMockMarketSnapshot } from "../lib/market/mock-market-provider";
import { toLegacyMarketSnapshot } from "../lib/market/normalize-market-data";
import {
  createAnimalLayout,
  createCloudLayout,
  createCropLayout,
  createParticleLayout,
  createRainLayout,
} from "../lib/ui/animation-layout";
import { formatMarketUpdatedAt, formatTaipeiQuoteTime } from "../lib/ui/market-time";

test("farm animation layouts are deterministic and retain every effect group", () => {
  assert.deepEqual(createParticleLayout(), createParticleLayout());
  assert.deepEqual(createCloudLayout(), createCloudLayout());
  assert.deepEqual(createCropLayout(), createCropLayout());
  assert.deepEqual(createRainLayout(), createRainLayout());
  assert.deepEqual(createAnimalLayout(), createAnimalLayout());
  assert.equal(createParticleLayout().length, 14);
  assert.equal(createCloudLayout().length, 3);
  assert.equal(createCropLayout().length, 18);
  assert.equal(createRainLayout().length, 30);
  assert.deepEqual(Object.keys(createAnimalLayout()), ["chicken", "sheep", "crow"]);
});

test("demo MarketSnapshot is deterministic across calls", () => {
  const first = getMockMarketSnapshot();
  const repeated = getMockMarketSnapshot();
  assert.deepEqual(first, repeated);
  assert.equal(first.tradingDate, "2026-07-17");
  assert.equal(first.lastUpdated, "2026-07-17T05:30:00.000Z");
});

test("market timestamps use a fixed Asia/Taipei representation", () => {
  const timestamp = "2026-07-17T05:30:00.000Z";
  assert.equal(formatMarketUpdatedAt(timestamp), "07/17 13:30");
  assert.equal(formatTaipeiQuoteTime(timestamp), "13:30:00");
  assert.equal(formatMarketUpdatedAt("invalid"), "--/-- --:--");
});

test("same initial MarketSnapshot produces identical SSR markup without browser globals", () => {
  const initialData = toLegacyMarketSnapshot(getMockMarketSnapshot());
  const first = renderToStaticMarkup(createElement(FarmMarketBattle, { initialData }));
  const repeated = renderToStaticMarkup(createElement(FarmMarketBattle, { initialData }));
  assert.equal(first, repeated);
  assert.match(first, /07\/17 13:30/);
  assert.match(first, /farm-animals/);
});

test("canonical snapshot conversion remains stable for hydration props", () => {
  const source = getMockMarketSnapshot();
  assert.deepEqual(toLegacyMarketSnapshot(source), toLegacyMarketSnapshot(source));
});


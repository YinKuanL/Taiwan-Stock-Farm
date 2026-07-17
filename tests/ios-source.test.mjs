import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("native bridge validates and shares the canonical snapshot", async () => {
  const [model, plugin, bridge] = await Promise.all([
    read("ios-native/Shared/MarketSnapshot.swift"),
    read("ios-native/App/MarketSnapshotPlugin.swift"),
    read("ios-native/App/FarmBridgeViewController.swift"),
  ]);
  assert.match(model, /group\.com\.kuan\.farmmarketbattle/);
  assert.match(model, /snapshotKey = "marketSnapshot"/);
  assert.match(model, /struct MarketSnapshot: Codable/);
  assert.match(plugin, /CAPBridgedPlugin/);
  assert.match(plugin, /JSONDecoder\(\)\.decode\(MarketSnapshot\.self/);
  assert.match(plugin, /WidgetCenter\.shared\.reloadTimelines/);
  assert.match(bridge, /registerPluginInstance\(MarketSnapshotPlugin\(\)\)/);
});

test("widget includes three families, stale state, timeline and battle deep link", async () => {
  const widget = await read("ios-native/Widget/FarmMarketWidget.swift");
  assert.match(widget, /systemSmall/);
  assert.match(widget, /systemMedium/);
  assert.match(widget, /systemLarge/);
  assert.match(widget, /FarmMarketBattleWidget/);
  assert.match(widget, /farmmarketbattle:\/\/battle/);
  assert.match(widget, /isStale/);
  assert.match(widget, /TimelineProvider/);
  assert.match(widget, /SmallFarmWidget/);
  assert.match(widget, /MediumFarmWidget/);
  assert.match(widget, /LargeFarmWidget/);
});

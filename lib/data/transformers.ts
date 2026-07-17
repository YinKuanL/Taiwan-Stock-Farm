import type { FarmMood, MarketMover, MarketSnapshot } from "@/lib/types/market";

type TwseIndexRow = Record<string, string>;
type TwseStockRow = Record<string, string>;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const numberFrom = (value: string | number | undefined) => {
  const parsed = Number(String(value ?? "0").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const rocDateToIso = (date: string | undefined) => {
  if (!date || date.length !== 7) return new Date().toISOString().slice(0, 10);
  const year = Number(date.slice(0, 3)) + 1911;
  return `${year}-${date.slice(3, 5)}-${date.slice(5, 7)}`;
};

export interface SnapshotSeed {
  marketName?: string;
  date?: string;
  taiexClose?: number;
  taiexChange?: number;
  taiexChangePercent?: number;
  advancersCount?: number;
  declinersCount?: number;
  unchangedCount?: number;
  volume?: number;
  turnover?: number;
  topGainers?: MarketMover[];
  topLosers?: MarketMover[];
}

export function deriveSnapshot(
  seed: SnapshotSeed,
  dataMode: MarketSnapshot["dataMode"] = "demo",
): MarketSnapshot {
  const advancersCount = seed.advancersCount ?? 0;
  const declinersCount = seed.declinersCount ?? 0;
  const unchangedCount = seed.unchangedCount ?? 0;
  const total = Math.max(advancersCount + declinersCount + unchangedCount, 1);
  const breadth = ((advancersCount - declinersCount) / total) * 100;
  const changePercent = seed.taiexChangePercent ?? 0;
  const momentum = clamp(changePercent * 26, -72, 72);
  const sentimentScore = Math.round(clamp(momentum + breadth * 0.46, -100, 100));
  const bullPower = Math.round(clamp(50 + sentimentScore * 0.48, 4, 96));
  const bearPower = 100 - bullPower;

  let harvestLevel = 0;
  if (changePercent <= -0.5) harvestLevel = 1;
  if (changePercent <= -1) harvestLevel = 2;
  if (changePercent <= -2) harvestLevel = 3;
  if (changePercent <= -3.5) harvestLevel = 4;
  if (changePercent <= -5) harvestLevel = 5;

  const weatherLevel = Math.round(clamp(Math.abs(changePercent) * 1.25 + Math.abs(breadth) / 30, 0, 5));
  let farmMood: FarmMood = "neutral";
  if (changePercent <= -2.5 || harvestLevel >= 4) farmMood = "panic";
  else if (changePercent >= 2.2) farmMood = "celebration";
  else if (bullPower >= 60) farmMood = "bull";
  else if (bearPower >= 60) farmMood = "bear";

  return {
    marketName: seed.marketName ?? "臺灣證券交易所",
    date: seed.date ?? new Date().toISOString().slice(0, 10),
    lastUpdated: new Date().toISOString(),
    taiexClose: seed.taiexClose ?? 0,
    taiexChange: seed.taiexChange ?? 0,
    taiexChangePercent: changePercent,
    advancersCount,
    declinersCount,
    unchangedCount,
    volume: seed.volume ?? 0,
    turnover: seed.turnover ?? 0,
    topGainers: seed.topGainers ?? [],
    topLosers: seed.topLosers ?? [],
    sentimentScore,
    bullPower,
    bearPower,
    harvestLevel,
    weatherLevel,
    farmMood,
    dataMode,
    dataMessage:
      dataMode === "live"
        ? "證交所最新收盤資料"
        : "目前使用示範資料，完整互動仍可使用",
  };
}

export function transformTwseData(
  indexRows: TwseIndexRow[],
  stockRows: TwseStockRow[],
): MarketSnapshot {
  const taiex = indexRows.find((row) => row["指數"] === "發行量加權股價指數");
  if (!taiex) throw new Error("TWSE response is missing the TAIEX row");

  const stocks = stockRows
    .filter((row) => /^\d{4}$/.test(row.Code ?? ""))
    .map((row): MarketMover => {
      const price = numberFrom(row.ClosingPrice);
      const change = numberFrom(row.Change);
      const previousClose = price - change;
      return {
        code: row.Code,
        name: row.Name || row.Code,
        price,
        change,
        changePercent: previousClose ? (change / previousClose) * 100 : 0,
        volume: numberFrom(row.TradeVolume),
      };
    })
    .filter((stock) => stock.price > 0);

  const advancers = stocks.filter((stock) => stock.change > 0);
  const decliners = stocks.filter((stock) => stock.change < 0);
  const unchanged = stocks.filter((stock) => stock.change === 0);
  const byPercentDesc = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const signedChange = numberFrom(taiex["漲跌點數"]) * (taiex["漲跌"] === "-" ? -1 : 1);

  return deriveSnapshot(
    {
      marketName: "臺灣證券交易所｜上市市場",
      date: rocDateToIso(taiex["日期"]),
      taiexClose: numberFrom(taiex["收盤指數"]),
      taiexChange: signedChange,
      taiexChangePercent: numberFrom(taiex["漲跌百分比"]),
      advancersCount: advancers.length,
      declinersCount: decliners.length,
      unchangedCount: unchanged.length,
      volume: stocks.reduce((sum, stock) => sum + stock.volume, 0),
      turnover: stockRows.reduce((sum, row) => sum + numberFrom(row.TradeValue), 0),
      topGainers: byPercentDesc.slice(0, 5),
      topLosers: byPercentDesc.slice(-5).reverse(),
    },
    "live",
  );
}


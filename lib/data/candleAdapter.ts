import type { CandleSeries, StockCandle } from "@/lib/types/financial";

type TwseStockDayResponse = {
  stat?: string;
  title?: string;
  data?: string[][];
};

const numberFrom = (value: string | undefined) => {
  const parsed = Number((value ?? "0").replaceAll(",", "").replace("+", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const rocSlashDate = (value: string) => {
  const [year, month, day] = value.split("/");
  return `${Number(year) + 1911}-${month}-${day}`;
};

const monthKeys = (count: number) => {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}01`;
  });
};

function createDemoCandles(code: string): StockCandle[] {
  const seed = Number(code) || 2330;
  let close = code === "2330" ? 2180 : 80 + seed % 320;
  return Array.from({ length: 60 }, (_, index) => {
    const wave = Math.sin((index + seed) * .43) * close * .018;
    const drift = (index - 30) * close * .0011;
    const open = close + Math.cos((index + seed) * .71) * close * .008;
    const nextClose = Math.max(1, close + wave * .25 + drift * .03);
    const high = Math.max(open, nextClose) + Math.abs(Math.sin(index * .9)) * close * .012;
    const low = Math.min(open, nextClose) - Math.abs(Math.cos(index * .67)) * close * .011;
    const date = new Date();
    date.setDate(date.getDate() - (59 - index));
    close = nextClose;
    return {
      date: date.toISOString().slice(0, 10),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(nextClose.toFixed(2)),
      volume: Math.round(12_000_000 + Math.abs(Math.sin(index * .37)) * 45_000_000),
      change: Number((nextClose - open).toFixed(2)),
    };
  });
}

export async function getStockCandles(code: string): Promise<CandleSeries> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const responses = await Promise.all(monthKeys(4).map(async (date) => {
      const url = new URL("https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY");
      url.searchParams.set("date", date);
      url.searchParams.set("stockNo", code);
      url.searchParams.set("response", "json");
      const response = await fetch(url, { cache: "no-store", signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`TWSE candle request failed (${response.status})`);
      return response.json() as Promise<TwseStockDayResponse>;
    }));

    const candles = responses
      .flatMap((response) => response.stat === "OK" ? response.data ?? [] : [])
      .map((row): StockCandle => ({
        date: rocSlashDate(row[0]),
        volume: numberFrom(row[1]),
        open: numberFrom(row[3]),
        high: numberFrom(row[4]),
        low: numberFrom(row[5]),
        close: numberFrom(row[6]),
        change: numberFrom(row[7]),
      }))
      .filter((candle) => candle.open > 0 && candle.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-80);
    if (!candles.length) throw new Error("No candle data returned");

    const title = responses.find((response) => response.title)?.title ?? "";
    const name = title.match(/\d{4}\s+([^\s]+)/)?.[1] ?? code;
    return { code, name, candles, dataMode: "live", dataMessage: "證交所最近四個月日成交資料" };
  } catch (error) {
    console.warn("Using demo candles:", error);
    return {
      code,
      name: code,
      candles: createDemoCandles(code),
      dataMode: "demo",
      dataMessage: "官方歷史行情暫不可用，目前顯示示範 K 線",
    };
  } finally {
    clearTimeout(timeout);
  }
}

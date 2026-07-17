import { deriveSnapshot } from "@/lib/data/transformers";
import type { MarketSnapshot, RealtimeIndexQuote } from "@/lib/types/market";

type MisIndexRow = {
  d?: string;
  t?: string;
  z?: string;
  y?: string;
  o?: string;
  h?: string;
  l?: string;
  tlong?: string;
};

type MisResponse = {
  msgArray?: MisIndexRow[];
  userDelay?: number;
  rtcode?: string;
  queryTime?: { sysDate?: string; sysTime?: string };
};

const numberFrom = (value: string | undefined) => {
  const parsed = Number((value ?? "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const isoDate = (value: string | undefined) => {
  if (!value || value.length !== 8) throw new Error("MIS response has no trading date");
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

const clockMinutes = (value: string | undefined) => {
  const [hours = "0", minutes = "0"] = (value ?? "").split(":");
  return Number(hours) * 60 + Number(minutes);
};

export async function getRealtimeIndexQuote(): Promise<RealtimeIndexQuote> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const url = new URL("https://mis.twse.com.tw/stock/api/getStockInfo.jsp");
    url.searchParams.set("ex_ch", "tse_t00.tw");
    url.searchParams.set("json", "1");
    url.searchParams.set("delay", "0");
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json", Referer: "https://mis.twse.com.tw/stock/index.jsp" },
    });
    if (!response.ok) throw new Error(`TWSE MIS request failed (${response.status})`);
    const payload = await response.json() as MisResponse;
    const row = payload.msgArray?.[0];
    if (payload.rtcode !== "0000" || !row) throw new Error("TWSE MIS response is incomplete");

    const previousClose = numberFrom(row.y);
    const tradedValue = numberFrom(row.z);
    const value = tradedValue || previousClose;
    if (!value || !previousClose) throw new Error("TWSE MIS index value is unavailable");
    const change = value - previousClose;
    const marketDate = row.d;
    const queryDate = payload.queryTime?.sysDate;
    const queryMinutes = clockMinutes(payload.queryTime?.sysTime);
    const isSameTradingDay = Boolean(marketDate && marketDate === queryDate);
    const phase = !isSameTradingDay || queryMinutes > 13 * 60 + 30
      ? "closed"
      : queryMinutes < 9 * 60
        ? "preopen"
        : "open";
    const timestamp = Number(row.tlong);

    return {
      date: isoDate(marketDate),
      time: row.t ?? "--:--:--",
      value,
      previousClose,
      change: Number(change.toFixed(2)),
      changePercent: Number((change / previousClose * 100).toFixed(4)),
      open: numberFrom(row.o),
      high: numberFrom(row.h),
      low: numberFrom(row.l),
      phase,
      refreshAfterMs: Math.max(5000, Math.min(30000, Number(payload.userDelay) || 5000)),
      sourceTimestamp: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function mergeRealtimeQuote(snapshot: MarketSnapshot, quote: RealtimeIndexQuote): MarketSnapshot {
  const next = deriveSnapshot({
    marketName: snapshot.marketName,
    date: quote.date,
    taiexClose: quote.value,
    taiexChange: quote.change,
    taiexChangePercent: quote.changePercent,
    advancersCount: snapshot.advancersCount,
    declinersCount: snapshot.declinersCount,
    unchangedCount: snapshot.unchangedCount,
    volume: snapshot.volume,
    turnover: snapshot.turnover,
    topGainers: snapshot.topGainers,
    topLosers: snapshot.topLosers,
  }, snapshot.dataMode);

  const phaseLabel = quote.phase === "open" ? "盤中 5 秒行情" : quote.phase === "preopen" ? "開盤前行情" : "今日收盤行情";
  return {
    ...next,
    lastUpdated: quote.sourceTimestamp,
    dataMessage: snapshot.dataMode === "live"
      ? `證交所 MIS ${phaseLabel}；市場廣度與排行採最新盤後資料`
      : `證交所 MIS ${phaseLabel}；市場廣度與排行目前為示範資料`,
    quotePhase: quote.phase,
    quoteTime: quote.time,
    quoteRefreshAfterMs: quote.refreshAfterMs,
    productStatus: quote.phase === "open" ? "live" : "delayed",
  };
}

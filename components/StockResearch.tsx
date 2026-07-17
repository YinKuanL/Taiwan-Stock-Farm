"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Coins,
  Database,
  FileChartColumn,
  Landmark,
  LoaderCircle,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import CandlestickChart from "@/components/CandlestickChart";
import type { CandleSeries, FinancialReport, StockSearchResult } from "@/lib/types/financial";
import { useHydrationSafeReducedMotion } from "@/lib/ui/use-hydration-safe-reduced-motion";

type ReportTab = "candles" | "profit" | "balance" | "revenue";

const popularStocks = [
  { code: "2330", name: "台積電" },
  { code: "2454", name: "聯發科" },
  { code: "2317", name: "鴻海" },
  { code: "2881", name: "富邦金" },
];

const number = (value: number, digits = 2) =>
  new Intl.NumberFormat("zh-TW", { maximumFractionDigits: digits }).format(value);

const formatAmount = (value: number | null) => {
  if (value === null) return "不適用";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} 兆`;
  if (absolute >= 100_000) return `${(value / 100_000).toFixed(1)} 億`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)} 百萬`;
  return number(value, 0);
};

function Metric({ label, value, note, tone = "default" }: { label: string; value: string; note?: string; tone?: "default" | "positive" | "negative" }) {
  return (
    <article className={`financial-metric ${tone}`}>
      <small>{label}</small><strong>{value}</strong>{note && <span>{note}</span>}
    </article>
  );
}

function RatioBar({ label, value }: { label: string; value: number | null }) {
  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="ratio-row">
      <div><span>{label}</span><strong>{value === null ? "—" : `${value.toFixed(1)}%`}</strong></div>
      <div className="ratio-track"><motion.i initial={{ width: 0 }} animate={{ width: `${safeValue}%` }} transition={{ duration: .8, ease: [0.22, 1, 0.36, 1] }} /></div>
    </div>
  );
}

export default function StockResearch() {
  const reduceMotion = useHydrationSafeReducedMotion();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [selected, setSelected] = useState<StockSearchResult | null>(null);
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [candleSeries, setCandleSeries] = useState<CandleSeries | null>(null);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [candleLoading, setCandleLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [candleError, setCandleError] = useState("");
  const [tab, setTab] = useState<ReportTab>("candles");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const response = await fetch(`/api/stocks?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json() as StockSearchResult[];
        setResults(data);
        setActiveIndex(data.length ? 0 : -1);
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") setError("目前無法取得股票清單，請稍後再試。");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, query ? 260 : 80);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const selectStock = async (stock: StockSearchResult) => {
    setSelected(stock);
    setQuery(`${stock.code} ${stock.name}`);
    setOpen(false);
    setReport(null);
    setCandleSeries(null);
    setReportLoading(true);
    setCandleLoading(true);
    setError("");
    setCandleError("");
    setTab("candles");

    const financialTask = fetch(`/api/financials?code=${stock.code}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as FinancialReport | { message?: string };
        if (!response.ok || !("metrics" in data)) throw new Error("message" in data ? data.message : "Report failed");
        setReport(data);
      })
      .catch((caught) => setError(caught instanceof Error && caught.message !== "Report failed" ? caught.message : "目前找不到這家公司的可用財報。"))
      .finally(() => setReportLoading(false));

    const candleTask = fetch(`/api/candles?code=${stock.code}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as CandleSeries | { message?: string };
        if (!response.ok || !("candles" in data)) throw new Error("message" in data ? data.message : "Candle data failed");
        setCandleSeries(data);
      })
      .catch((caught) => setCandleError(caught instanceof Error && caught.message !== "Candle data failed" ? caught.message : "目前找不到這檔股票的日 K 資料。"))
      .finally(() => setCandleLoading(false));

    await Promise.all([financialTask, candleTask]);
  };

  const selectPopular = async (code: string) => {
    setSearching(true);
    setError("");
    try {
      const response = await fetch(`/api/stocks?q=${code}`, { cache: "no-store" });
      const data = await response.json() as StockSearchResult[];
      if (!data[0]) throw new Error("Stock not found");
      await selectStock(data[0]);
    } catch {
      setError("目前無法取得這檔股票，請稍後再試。");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      void selectStock(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const pricePositive = (selected?.change ?? 0) >= 0;
  const currentTab = useMemo(() => {
    if (tab === "candles") {
      if (candleLoading) return <div className="inline-chart-loading"><LoaderCircle /><span>正在整理歷史成交資料…</span></div>;
      if (candleSeries) return <CandlestickChart series={candleSeries} />;
      return <div className="inline-chart-error"><strong>日 K 暫時無法顯示</strong><span>{candleError || "請稍後重新查詢。"}</span></div>;
    }
    if (!report) return <div className="inline-chart-error"><strong>財報暫時無法顯示</strong><span>{error || "這家公司目前沒有可用的申報資料。"}</span></div>;
    if (tab === "profit") {
      return (
        <motion.div className="financial-tab-content" key="profit" initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}>
          <div className="financial-metric-grid">
            <Metric label={report.category === "一般業" ? "累計營業收入" : "累計淨收益"} value={formatAmount(report.metrics.revenue)} />
            <Metric label="營業利益" value={formatAmount(report.metrics.operatingIncome)} />
            <Metric label="本期淨利" value={formatAmount(report.metrics.netIncome)} tone={(report.metrics.netIncome ?? 0) >= 0 ? "positive" : "negative"} />
            <Metric label="基本 EPS" value={report.metrics.eps === null ? "不適用" : `${report.metrics.eps.toFixed(2)} 元`} note={report.period} />
          </div>
          <div className="ratio-panel">
            <RatioBar label="毛利率" value={report.ratios.grossMargin} />
            <RatioBar label="營業利益率" value={report.ratios.operatingMargin} />
            <RatioBar label="淨利率" value={report.ratios.netMargin} />
          </div>
        </motion.div>
      );
    }
    if (tab === "balance") {
      return (
        <motion.div className="financial-tab-content" key="balance" initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}>
          <div className="financial-metric-grid">
            <Metric label="資產總額" value={formatAmount(report.metrics.totalAssets)} />
            <Metric label="負債總額" value={formatAmount(report.metrics.totalLiabilities)} />
            <Metric label="權益總額" value={formatAmount(report.metrics.totalEquity)} />
            <Metric label="每股參考淨值" value={report.metrics.bookValuePerShare === null ? "不適用" : `${report.metrics.bookValuePerShare.toFixed(2)} 元`} />
          </div>
          <div className="balance-composition">
            <div><span>權益</span><i style={{ width: `${Math.max(0, 100 - (report.ratios.debtRatio ?? 0))}%` }} /></div>
            <div><span>負債</span><i style={{ width: `${Math.min(100, report.ratios.debtRatio ?? 0)}%` }} /></div>
            <strong>負債比 {report.ratios.debtRatio === null ? "—" : `${report.ratios.debtRatio.toFixed(1)}%`}</strong>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div className="financial-tab-content" key="revenue" initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(5px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}>
        <div className="financial-metric-grid revenue-grid">
          <Metric label={`${report.revenueMonth ?? "最新"} 單月營收`} value={formatAmount(report.metrics.monthlyRevenue)} />
          <Metric label="月增率 MoM" value={report.metrics.monthlyRevenueMom === null ? "不適用" : `${report.metrics.monthlyRevenueMom.toFixed(2)}%`} tone={(report.metrics.monthlyRevenueMom ?? 0) >= 0 ? "positive" : "negative"} />
          <Metric label="年增率 YoY" value={report.metrics.monthlyRevenueYoy === null ? "不適用" : `${report.metrics.monthlyRevenueYoy.toFixed(2)}%`} tone={(report.metrics.monthlyRevenueYoy ?? 0) >= 0 ? "positive" : "negative"} />
        </div>
        <div className="report-note"><Sparkles size={16} /><p><strong>公司說明</strong>{report.note}</p></div>
      </motion.div>
    );
  }, [report, tab, reduceMotion, candleLoading, candleSeries, candleError, error]);

  return (
    <section className="research-section" id="research">
      <div className="research-intro">
        <div><span className="eyebrow">STOCK RESEARCH DESK</span><h2>查一檔股票，<em>看懂它的收成。</em></h2><p>輸入上市股票代碼或名稱，快速查看今日行情與最新一季財報摘要。</p></div>
        <div className="research-source"><Database size={16} /><span><strong>官方資料優先</strong><small>證交所／公開資訊觀測站</small></span></div>
      </div>

      <div className="research-workspace">
        <div className="stock-search-area">
          <label htmlFor="stock-search">搜尋上市公司</label>
          <div className={`search-combobox ${open ? "open" : ""}`}>
            <Search size={20} />
            <input
              id="stock-search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="例如：2330、台積電"
              role="combobox"
              aria-expanded={open}
              aria-controls="stock-results"
              aria-activedescendant={activeIndex >= 0 ? `stock-result-${activeIndex}` : undefined}
              autoComplete="off"
            />
            {searching && <LoaderCircle className="search-spinner" size={18} />}
            {query && !searching && <button className="clear-search" onClick={() => { setQuery(""); setSelected(null); setReport(null); setCandleSeries(null); setOpen(true); }} aria-label="清除搜尋"><X size={15} /></button>}
            <AnimatePresence>
              {open && (
                <motion.div id="stock-results" className="search-results" role="listbox" initial={{ opacity: 0, y: -6, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5 }}>
                  <div className="results-label"><span>{query ? "搜尋結果" : "今日上市股票"}</span><small>↑↓ 選擇 · Enter 開啟</small></div>
                  {results.length ? results.map((stock, index) => (
                    <button
                      id={`stock-result-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      className={activeIndex === index ? "active" : ""}
                      key={stock.code}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => void selectStock(stock)}
                    >
                      <span className="result-code">{stock.code}</span>
                      <span className="result-name"><strong>{stock.name}</strong><small>{stock.dataMode === "live" ? "上市｜最新收盤" : "上市｜示範快照"}</small></span>
                      <span className="result-price"><strong>{number(stock.price)}</strong><small className={stock.change >= 0 ? "up" : "down"}>{stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%</small></span>
                    </button>
                  )) : <div className="no-results"><Search size={20} /><span>{searching ? "正在翻找穀倉…" : "沒有找到符合的上市股票"}</span></div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="popular-searches"><span>快速查詢</span>{popularStocks.map((stock) => <button key={stock.code} onClick={() => void selectPopular(stock.code)}>{stock.code} {stock.name}</button>)}</div>
          <p className="search-disclaimer">財報金額以仟元為原始單位，介面會自動換算為億元或兆元。</p>
        </div>

        <div className="report-area" aria-live="polite">
          {!selected && !reportLoading && !candleLoading && (
            <div className="report-empty"><span className="empty-orbit"><FileChartColumn size={28} /></span><h3>選一家公司開始研究</h3><p>日 K、行情、獲利能力、資產體質與月營收會整理在這裡。</p><div><span><TrendingUp size={15} />日 K 走勢</span><span><Landmark size={15} />資產負債</span><span><Coins size={15} />月營收</span></div></div>
          )}
          {selected && reportLoading && candleLoading && (
            <div className="report-loading"><LoaderCircle /><strong>正在整理 {selected.name} 的研究資料</strong><span>同步載入日 K 與最新申報資料…</span><i /><i /><i /></div>
          )}
          {selected && !reportLoading && !candleLoading && error && candleError && !report && !candleSeries && (
            <div className="report-error"><span>!</span><h3>研究資料暫時沒有送達</h3><p>{candleError || error}</p><button onClick={() => void selectStock(selected)}>重新查詢</button></div>
          )}
          {selected && (!reportLoading || !candleLoading) && (report || candleSeries) && (
            <motion.div className="financial-report" initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: .72, ease: [0.22, 1, 0.36, 1] }}>
              <div className="report-header">
                <div className="company-identity"><span><Building2 /></span><div><small>{selected.code} · {report?.industry ?? "上市公司"}</small><h3>{report?.name ?? selected.name}</h3></div></div>
                <div className="stock-quote"><strong>{number(selected.price)}</strong><span className={pricePositive ? "up" : "down"}>{pricePositive ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{pricePositive ? "+" : ""}{selected.changePercent.toFixed(2)}%</span></div>
              </div>
              <div className="report-meta"><span className={(report ?? candleSeries)?.dataMode}><i />{(report ?? candleSeries)?.dataMode === "live" ? "官方最新資料" : "示範快照"}</span>{report && <><span>{report.period}</span><span>出表 {report.reportDate}</span><small>{report.category}</small></>}</div>
              <div className="report-tabs" role="tablist" aria-label="財報分類">
                <button role="tab" aria-selected={tab === "candles"} className={tab === "candles" ? "active" : ""} onClick={() => setTab("candles")}>日 K 走勢</button>
                <button role="tab" disabled={!report} aria-selected={tab === "profit"} className={tab === "profit" ? "active" : ""} onClick={() => setTab("profit")}>獲利能力</button>
                <button role="tab" disabled={!report} aria-selected={tab === "balance"} className={tab === "balance" ? "active" : ""} onClick={() => setTab("balance")}>資產體質</button>
                <button role="tab" disabled={!report} aria-selected={tab === "revenue"} className={tab === "revenue" ? "active" : ""} onClick={() => setTab("revenue")}>月營收</button>
              </div>
              {currentTab}
              <p className="report-source-line"><Database size={13} />{tab === "candles" ? candleSeries?.dataMessage : report?.dataMessage} · 僅供資訊整理，不構成投資建議</p>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

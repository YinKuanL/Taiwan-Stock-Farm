"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CandleSeries, StockCandle } from "@/lib/types/financial";

const compact = (value: number) =>
  new Intl.NumberFormat("zh-TW", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const price = (value: number) =>
  new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 2 }).format(value);

export default function CandlestickChart({ series }: { series: CandleSeries }) {
  const [range, setRange] = useState<20 | 40 | 60>(40);
  const [hovered, setHovered] = useState<StockCandle | null>(null);
  const data = useMemo(() => series.candles.slice(-range), [series, range]);
  const width = 820;
  const height = 310;
  const left = 18;
  const right = 58;
  const priceTop = 18;
  const priceBottom = 218;
  const volumeTop = 244;
  const volumeBottom = 292;
  const plotWidth = width - left - right;
  const step = plotWidth / Math.max(data.length, 1);
  const bodyWidth = Math.max(3, Math.min(10, step * .58));
  const low = Math.min(...data.map((item) => item.low));
  const high = Math.max(...data.map((item) => item.high));
  const pricePadding = Math.max((high - low) * .09, high * .008);
  const minPrice = low - pricePadding;
  const maxPrice = high + pricePadding;
  const maxVolume = Math.max(...data.map((item) => item.volume), 1);
  const yPrice = (value: number) => priceBottom - ((value - minPrice) / Math.max(maxPrice - minPrice, 1)) * (priceBottom - priceTop);
  const yVolume = (value: number) => volumeBottom - value / maxVolume * (volumeBottom - volumeTop);
  const last = data.at(-1);
  const first = data[0];
  const periodChange = first && last ? (last.close - first.open) / first.open * 100 : 0;
  const gridValues = Array.from({ length: 5 }, (_, index) => minPrice + (maxPrice - minPrice) * index / 4);

  return (
    <div className="candlestick-module">
      <div className="candle-toolbar">
        <div>
          <span className={`candle-data-mode ${series.dataMode}`}><i />{series.dataMode === "live" ? "官方日 K" : "示範 K 線"}</span>
          <strong>{last ? price(last.close) : "—"}</strong>
          <small className={periodChange >= 0 ? "k-up" : "k-down"}>{periodChange >= 0 ? "+" : ""}{periodChange.toFixed(2)}%／區間</small>
        </div>
        <div className="candle-range" aria-label="K 線顯示區間">
          {([20, 40, 60] as const).map((days) => <button className={range === days ? "active" : ""} key={days} onClick={() => setRange(days)}>{days}日</button>)}
        </div>
      </div>

      <div className="candle-chart-wrap" onMouseLeave={() => setHovered(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${series.code} 最近 ${range} 個交易日 K 線圖`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="volumeUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d87c6e" stopOpacity=".52" /><stop offset="1" stopColor="#d87c6e" stopOpacity=".08" /></linearGradient>
            <linearGradient id="volumeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5e9770" stopOpacity=".5" /><stop offset="1" stopColor="#5e9770" stopOpacity=".08" /></linearGradient>
          </defs>
          {gridValues.map((value) => {
            const y = yPrice(value);
            return <g key={value}><line x1={left} x2={width - right} y1={y} y2={y} className="candle-grid-line" /><text x={width - right + 8} y={y + 4} className="candle-axis-text">{price(value)}</text></g>;
          })}
          <line x1={left} x2={width - right} y1={volumeTop - 10} y2={volumeTop - 10} className="candle-divider" />
          {data.map((candle, index) => {
            const x = left + step * index + step / 2;
            const up = candle.close >= candle.open;
            const bodyTop = yPrice(Math.max(candle.open, candle.close));
            const bodyBottom = yPrice(Math.min(candle.open, candle.close));
            const bodyHeight = Math.max(2, bodyBottom - bodyTop);
            return (
              <g key={candle.date} className={up ? "candle-up" : "candle-down"}>
                <line x1={x} x2={x} y1={yPrice(candle.high)} y2={yPrice(candle.low)} className="candle-wick" />
                <rect x={x - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyHeight} rx="1" className="candle-body" />
                <rect x={x - bodyWidth / 2} y={yVolume(candle.volume)} width={bodyWidth} height={volumeBottom - yVolume(candle.volume)} rx="1" fill={up ? "url(#volumeUp)" : "url(#volumeDown)"} />
                <rect x={x - step / 2} y={priceTop} width={step} height={volumeBottom - priceTop} fill="transparent" onMouseEnter={() => setHovered(candle)} onTouchStart={() => setHovered(candle)} />
                {(index === 0 || index === data.length - 1 || index === Math.floor(data.length / 2)) && <text x={x} y={306} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} className="candle-axis-text">{candle.date.slice(5).replace("-", "/")}</text>}
              </g>
            );
          })}
        </svg>
        {hovered && (
          <motion.div className="candle-tooltip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <strong>{hovered.date}</strong><span>開 {price(hovered.open)}</span><span>高 {price(hovered.high)}</span><span>低 {price(hovered.low)}</span><span>收 {price(hovered.close)}</span><small>量 {compact(hovered.volume)}</small>
          </motion.div>
        )}
      </div>
      <div className="candle-footnote"><span><i className="legend-up" />上漲</span><span><i className="legend-down" />下跌</span><p>{series.dataMessage} · 成交量顯示於下方</p></div>
    </div>
  );
}

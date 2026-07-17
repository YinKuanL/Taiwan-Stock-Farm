"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  CloudRainWind,
  Gauge,
  Info,
  Leaf,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Sun,
  Trophy,
  WandSparkles,
  Wheat,
} from "lucide-react";
import { createNarration } from "@/lib/data/narration";
import { mergeRealtimeQuote } from "@/lib/data/realtimeAdapter";
import { createScenarioSnapshot } from "@/lib/data/scenario";
import { getSceneState } from "@/lib/data/sceneRules";
import { marketApiUrl } from "@/lib/market/client";
import { toLegacyMarketSnapshot, toProductMarketSnapshot } from "@/lib/market/normalize-market-data";
import type { MarketSnapshot as ProductMarketSnapshot } from "@/lib/market/types";
import { syncSnapshotToNative } from "@/lib/native/snapshotBridge";
import { FARM_ANIMATION_LAYOUT } from "@/lib/ui/animation-layout";
import { formatMarketUpdatedAt } from "@/lib/ui/market-time";
import { useHydrationSafeReducedMotion } from "@/lib/ui/use-hydration-safe-reduced-motion";
import type { MarketMover, MarketSnapshot, RealtimeIndexQuote } from "@/lib/types/market";
import StockResearch from "@/components/StockResearch";

type Focus = "all" | "bull" | "bear" | "harvest";

const sandboxPresets = [
  { label: "風暴收割", score: -88, icon: "🌩️" },
  { label: "熊軍壓境", score: -48, icon: "🐻" },
  { label: "田埂拉鋸", score: 0, icon: "⚖️" },
  { label: "牛軍春耕", score: 48, icon: "🐂" },
  { label: "豐收慶典", score: 88, icon: "🌾" },
] as const;

const moodCopy = {
  bull: { label: "多軍春耕", icon: "☀", tone: "positive" },
  bear: { label: "熊軍壓境", icon: "☁", tone: "negative" },
  neutral: { label: "田埂拉鋸", icon: "⚖", tone: "neutral" },
  panic: { label: "收割警報", icon: "⚠", tone: "negative" },
  celebration: { label: "豐收慶典", icon: "✦", tone: "positive" },
} as const;

const formatNumber = (value: number, digits = 0) =>
  new Intl.NumberFormat("zh-TW", { maximumFractionDigits: digits }).format(value);

const formatMarketValue = (value: number) => {
  if (!value) return "—";
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)} 億`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)} 萬`;
  return formatNumber(value);
};

function NumberTicker({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(frame);
    }
    const startValue = shown;
    const difference = value - startValue;
    const start = performance.now();
    const duration = 720;
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(startValue + difference * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Intentionally animate from the currently displayed number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduceMotion]);

  return <>{shown.toFixed(decimals)}{suffix}</>;
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useHydrationSafeReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FarmScene({ snapshot, focus, onInspect }: {
  snapshot: MarketSnapshot;
  focus: Focus;
  onInspect: (title: string, text: string) => void;
}) {
  const scene = getSceneState(snapshot);
  const reduceMotion = useHydrationSafeReducedMotion();
  const { animals, clouds, crops, particles, rain } = FARM_ANIMATION_LAYOUT;
  const sceneStyle = {
    "--wind-speed": `${reduceMotion ? 0 : scene.windSpeed}s`,
    "--battle-line": `${scene.battleLine}%`,
  } as CSSProperties;

  return (
    <div className={`farm-scene sky-${scene.sky} focus-${focus}`} style={sceneStyle}>
      <div className="scene-atmosphere" />
      <button
        className="scene-hotspot sun-orb"
        onClick={() => onInspect("多頭太陽", `亮度跟著 Bull Power ${snapshot.bullPower} 調整。`)}
        aria-label="查看多頭太陽說明"
      >
        <span className="sun-core" />
        <span className="sun-ring" />
      </button>

      {clouds.map((cloud, index) => (
        <div
          className={`cloud cloud-${["one", "two", "three"][index]}`}
          key={cloud.id}
          style={{
            "--cloud-delay": `${cloud.delay}s`,
            "--cloud-duration": `${cloud.duration}s`,
            "--cloud-opacity": cloud.opacity,
          } as CSSProperties}
        ><span /><span /><span /></div>
      ))}
      {scene.sky === "storm" && (
        <div className="rain-layer" aria-hidden="true">
          {rain.map((drop) => (
            <i key={drop.id} style={{
              "--rain-left": `${drop.left}%`,
              "--rain-delay": `${drop.delay}s`,
              "--rain-duration": `${drop.duration}s`,
              "--rain-opacity": drop.opacity,
              "--rain-length": `${drop.length}px`,
            } as CSSProperties} />
          ))}
        </div>
      )}

      <div className="hills hills-back" />
      <div className="hills hills-front" />

      <button
        className="scene-hotspot windmill"
        onClick={() => onInspect("市場風車", `風速由市場天氣等級 ${snapshot.weatherLevel}/5 決定。`)}
        aria-label="查看市場風車說明"
      >
        <span className="windmill-tower" />
        <span className="windmill-wheel">
          <i /><i /><i /><i />
        </span>
      </button>

      <div className="barn" aria-hidden="true">
        <span className="barn-roof" /><span className="barn-body" /><span className="barn-door" />
      </div>

      <div className="battle-banner">
        <span className="live-dot" />
        <div><small>今日場景</small><strong>{scene.label}</strong></div>
      </div>

      <div className="battle-lane" aria-hidden="true">
        <div className="bull-territory" />
        <div className="bear-territory" />
        <div className="battle-marker"><span>VS</span></div>
      </div>

      <button
        className="scene-character bull-character"
        onClick={() => onInspect("多軍牛隊長", `今天掌握 ${snapshot.bullPower}% 戰力，正在守住晴天農場。`)}
        aria-label="查看多軍牛隊長"
      >
        <span className="character-shadow" /><span className="emoji" aria-hidden="true">🐂</span><small>多軍 {snapshot.bullPower}</small>
      </button>
      <button
        className="scene-character bear-character"
        onClick={() => onInspect("空軍熊隊長", `今天掌握 ${snapshot.bearPower}% 戰力，烏雲是牠的補給線。`)}
        aria-label="查看空軍熊隊長"
      >
        <span className="character-shadow" /><span className="emoji" aria-hidden="true">🐻</span><small>空軍 {snapshot.bearPower}</small>
      </button>

      <button
        className="scene-hotspot crop-field leek-field"
        onClick={() => onInspect("韭菜情緒田", `收割等級 ${snapshot.harvestLevel}/5；跌幅越深，收割風險越高。`)}
        aria-label="查看韭菜情緒田"
      >
        <span className="field-label">韭菜情緒田</span>
        <span className="crop-grid">
          {crops.map((crop) => <i key={crop.id} style={{ "--crop-delay": `${crop.delay}s`, "--crop-height": `${crop.height}px` } as CSSProperties} />)}
        </span>
      </button>

      <button
        className="scene-hotspot crop-field grain-field"
        onClick={() => onInspect("普漲稻穗田", `上漲 ${snapshot.advancersCount} 家；稻穗密度代表市場廣度。`)}
        aria-label="查看普漲稻穗田"
      >
        <span className="field-label">普漲稻穗田</span>
        <span className="grain-row">🌾 🌾 🌾 🌾 🌾</span>
        <span className="grain-row">🌾 🌾 🌾 🌾 🌾</span>
      </button>

      <div className="farm-animals">
        <button
          className="animal chicken-animal"
          style={{ "--animal-delay": `${animals.chicken.delay}s`, "--animal-duration": `${animals.chicken.duration}s` } as CSSProperties}
          onClick={() => onInspect("巡田小雞", "牠會沿著田邊散步、啄食；市場越平靜，巡田節奏越悠閒。")}
          aria-label="查看會巡田與啄食的小雞"
        >
          <span className="animal-shadow" aria-hidden="true" />
          <span className="chicken-body" aria-hidden="true"><i className="chicken-wing" /><i className="chicken-head"><b /><em /></i><i className="chicken-tail" /></span>
          <i className="animal-leg leg-one" aria-hidden="true" /><i className="animal-leg leg-two" aria-hidden="true" />
        </button>
        <button
          className="animal sheep-animal"
          style={{ "--animal-delay": `${animals.sheep.delay}s`, "--animal-duration": `${animals.sheep.duration}s` } as CSSProperties}
          onClick={() => onInspect("放牧綿羊", "牠會慢慢走向青草，偶爾低頭吃草，代表市場中的耐心資金。")}
          aria-label="查看會走動與吃草的綿羊"
        >
          <span className="animal-shadow" aria-hidden="true" />
          <span className="sheep-wool" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="sheep-head" aria-hidden="true"><i /><b /></span>
          <i className="sheep-leg sheep-leg-one" aria-hidden="true" /><i className="sheep-leg sheep-leg-two" aria-hidden="true" />
        </button>
        <button
          className="animal crow-animal"
          style={{ "--animal-delay": `${animals.crow.delay}s`, "--animal-duration": `${animals.crow.duration}s` } as CSSProperties}
          onClick={() => onInspect("巡場烏鴉", "牠會繞過戰場上空巡視；風雨越強，飛行路線看起來越緊張。")}
          aria-label="查看在農場上空飛行的烏鴉"
        >
          <span className="crow-body" aria-hidden="true"><i className="crow-wing wing-left" /><i className="crow-wing wing-right" /><b /></span>
        </button>
      </div>

      <AnimatePresence>
        {scene.showHarvester && (
          <motion.button
            className="harvester"
            initial={reduceMotion ? false : { x: "120%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "120%", opacity: 0 }}
            transition={{ duration: 1.85, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onInspect("風險收割機", "大盤明顯下跌時進場；是金融梗式警報，不代表任何交易建議。")}
            aria-label="查看風險收割機"
          >
            <span aria-hidden="true">🚜</span><small>收割 Lv.{snapshot.harvestLevel}</small>
          </motion.button>
        )}
      </AnimatePresence>

      {scene.showCelebration && (
        <div className="celebration-particles" aria-hidden="true">
          {particles.map((particle) => <i key={particle.id} style={{
            "--particle-left": `${particle.left}%`,
            "--particle-delay": `${particle.delay}s`,
            "--particle-duration": `${particle.duration}s`,
            "--particle-size": `${particle.size}px`,
            "--particle-drift": `${particle.drift}px`,
          } as CSSProperties}>✦</i>)}
        </div>
      )}

      <div className="scene-ground-glow" />
    </div>
  );
}

function PowerCard({ kind, value, active, onClick }: {
  kind: "bull" | "bear";
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  const bull = kind === "bull";
  return (
    <motion.button
      className={`power-card ${kind} ${active ? "is-active" : ""}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="power-card-top">
        <span className="power-icon" aria-hidden="true">{bull ? "🐂" : "🐻"}</span>
        <span><small>{bull ? "BULL POWER" : "BEAR POWER"}</small><strong><NumberTicker value={value} suffix="%" /></strong></span>
      </span>
      <span className="meter-track"><motion.i initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} /></span>
      <span className="power-card-caption">{bull ? "陽光、作物生長與推進動能" : "烏雲、收割風險與防守壓力"}</span>
    </motion.button>
  );
}

function Movers({ title, items, positive }: { title: string; items: MarketMover[]; positive: boolean }) {
  return (
    <article className={`movers-panel ${positive ? "gainers" : "losers"}`}>
      <div className="panel-heading">
        <div className="heading-icon">{positive ? <Trophy size={20} /> : <CloudRainWind size={20} />}</div>
        <div><span className="eyebrow">TODAY&apos;S CROPS</span><h3>{title}</h3></div>
      </div>
      <div className="mover-list">
        {items.length ? items.map((item, index) => (
          <motion.div className="mover-row" key={item.code} whileHover={{ x: 5 }}>
            <span className="rank">{String(index + 1).padStart(2, "0")}</span>
            <span className="crop-token" aria-hidden="true">{positive ? (index < 2 ? "🌽" : "🌾") : (index < 2 ? "🥬" : "🍂")}</span>
            <span className="stock-name"><strong>{item.name}</strong><small>{item.code} · {formatNumber(item.price, 2)}</small></span>
            <span className="stock-change">
              {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {item.changePercent > 0 ? "+" : ""}{item.changePercent.toFixed(2)}%
            </span>
          </motion.div>
        )) : <div className="empty-state">今天還沒有可用的作物排行。</div>}
      </div>
    </article>
  );
}

export default function FarmMarketBattle({ initialData, initialSection = "top" }: { initialData: MarketSnapshot; initialSection?: "top" | "battle" }) {
  const [marketSnapshot, setMarketSnapshot] = useState(initialData);
  const [mode, setMode] = useState<"normal" | "story">("normal");
  const [focus, setFocus] = useState<Focus>("all");
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [inspection, setInspection] = useState<{ title: string; text: string } | null>(null);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [sandboxScore, setSandboxScore] = useState(initialData.sentimentScore);
  const [discoveries, setDiscoveries] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "info" | "error" } | null>(null);
  const snapshot = useMemo(
    () => sandboxOpen ? createScenarioSnapshot(marketSnapshot, sandboxScore) : marketSnapshot,
    [marketSnapshot, sandboxOpen, sandboxScore],
  );
  const scene = useMemo(() => getSceneState(snapshot), [snapshot]);
  const mood = moodCopy[snapshot.farmMood];
  const positive = snapshot.taiexChange >= 0;
  const quoteLabel = snapshot.productStatus === "cached" ? "快取資料"
    : snapshot.productStatus === "unavailable" ? "無法更新"
    : snapshot.productStatus === "demo" ? "示範資料"
    : snapshot.quotePhase === "open"
    ? "5 秒行情"
    : snapshot.quotePhase === "preopen"
      ? "開盤前"
      : snapshot.quotePhase === "closed"
        ? "今日收盤"
      : snapshot.dataMode === "live" ? "最新收盤" : "DEMO 戰局";
  const updatedAt = useMemo(() => formatMarketUpdatedAt(snapshot.lastUpdated), [snapshot.lastUpdated]);

  const trendData = useMemo(() => {
    const labels = ["09:00", "10:00", "11:00", "12:00", "13:30"];
    const seed = snapshot.sentimentScore;
    return labels.map((time, index) => {
      const curve = Math.sin((index + snapshot.bullPower) * 0.9) * 9;
      const sentiment = Math.round(seed * (0.42 + index * 0.145) + curve);
      return {
        time,
        sentiment,
        bull: Math.max(5, Math.min(95, snapshot.bullPower - 13 + index * 3 + curve * 0.4)),
        bear: Math.max(5, Math.min(95, snapshot.bearPower + 10 - index * 2 - curve * 0.35)),
      };
    });
  }, [snapshot]);

  useEffect(() => {
    if (initialSection !== "battle") return;
    const frame = window.requestAnimationFrame(() => document.querySelector("#battle")?.scrollIntoView({ block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [initialSection]);

  useEffect(() => {
    void syncSnapshotToNative(toProductMarketSnapshot(marketSnapshot));
  }, [marketSnapshot]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (initialData.dataMode !== "demo") return;
    let cancelled = false;
    let timer = 0;
    let attempt = 0;

    const retryLiveSnapshot = async () => {
      attempt += 1;
      try {
        const response = await fetch(`${marketApiUrl()}?retry=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("retry failed");
        const productSnapshot = await response.json() as ProductMarketSnapshot;
        const nextSnapshot = toLegacyMarketSnapshot(productSnapshot);
        if (cancelled) return;
        if (nextSnapshot.productStatus === "live" || nextSnapshot.productStatus === "delayed") {
          setMarketSnapshot(nextSnapshot);
          setSandboxScore(nextSnapshot.sentimentScore);
          setToast({ message: "官方市場資料已連線，戰場自動更新完成", tone: "success" });
          return;
        }
      } catch {
        // The demo snapshot stays usable while the official service recovers.
      }
      if (!cancelled && attempt < 3) timer = window.setTimeout(retryLiveSnapshot, 2200 * attempt);
    };

    timer = window.setTimeout(retryLiveSnapshot, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [initialData.dataMode]);

  useEffect(() => {
    let disposed = false;
    let timer = 0;
    let controller: AbortController | undefined;

    const schedule = (delay: number) => {
      window.clearTimeout(timer);
      if (!disposed) timer = window.setTimeout(pollRealtimeIndex, delay);
    };

    const pollRealtimeIndex = async () => {
      if (document.hidden) {
        schedule(30000);
        return;
      }
      controller = new AbortController();
      let nextDelay = 60000;
      try {
        const response = await fetch(`/api/realtime?t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Realtime quote failed");
        const quote = await response.json() as RealtimeIndexQuote;
        if (disposed) return;
        setMarketSnapshot((current) => mergeRealtimeQuote(current, quote));
        nextDelay = quote.phase === "open" ? quote.refreshAfterMs : 60000;
      } catch (error) {
        if ((error as Error).name !== "AbortError") nextDelay = 15000;
      } finally {
        if (!disposed) schedule(nextDelay);
      }
    };

    const handleVisibility = () => {
      if (!document.hidden) {
        window.clearTimeout(timer);
        void pollRealtimeIndex();
      }
    };

    void pollRealtimeIndex();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setInspection(null);
      if (sandboxOpen) setSandboxOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sandboxOpen]);

  const refresh = async () => {
    setLoading(true);
    setRefreshError("");
    try {
      const response = await fetch(`${marketApiUrl()}?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("戰況更新失敗");
      const productSnapshot = await response.json() as ProductMarketSnapshot;
      const nextSnapshot = toLegacyMarketSnapshot(productSnapshot);
      setMarketSnapshot(nextSnapshot);
      setSandboxScore(nextSnapshot.sentimentScore);
      setToast({ message: "最新戰況已送進農場", tone: "success" });
    } catch {
      setRefreshError("即時連線暫時不穩，已保留目前可用戰況。");
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (next: Focus) => setFocus((current) => current === next ? "all" : next);

  const handleInspect = (title: string, text: string) => {
    setInspection({ title, text });
    if (discoveries.includes(title)) return;
    const nextDiscoveries = [...discoveries, title];
    setDiscoveries(nextDiscoveries);
    if (nextDiscoveries.length === 4) {
      setToast({ message: "戰場圖鑑解鎖：你已找到 4 個市場線索", tone: "success" });
    }
  };

  const openSandbox = () => {
    setSandboxScore(marketSnapshot.sentimentScore);
    setSandboxOpen(true);
    setInspection(null);
    setToast({ message: "情境沙盒已開啟；真實資料不會被改動", tone: "info" });
  };

  const closeSandbox = () => {
    setSandboxOpen(false);
    setFocus("all");
    setToast({ message: "已回到今日真實戰況", tone: "success" });
  };

  const shareBattle = async () => {
    const prefix = sandboxOpen ? "【Farm Market Battle 情境演練】" : "【Farm Market Battle 今日戰況】";
    const text = `${prefix}\n台股情緒 ${snapshot.sentimentScore}｜牛軍 ${snapshot.bullPower}% vs 熊軍 ${snapshot.bearPower}%\n${createNarration(snapshot, false)}\n${window.location.href}`;
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: "戰況文字已複製，可以分享給朋友了", tone: "success" });
    } catch {
      setToast({ message: "瀏覽器未允許複製，請稍後再試", tone: "error" });
    }
  };

  return (
    <main className={`site-shell mood-${snapshot.farmMood}`}>
      <nav className="topbar" aria-label="主要導覽">
        <a className="brand" href="#top" aria-label="Farm Market Battle 首頁">
          <span className="brand-mark"><Sprout size={20} /></span>
          <span>FARM <b>MARKET</b> BATTLE</span>
        </a>
        <div className="topbar-actions">
          <a className="research-link" href="#research"><Search size={15} /><span>查股票／財報</span></a>
          <span className={`data-pill ${sandboxOpen ? "sandbox" : snapshot.productStatus ?? snapshot.dataMode} ${snapshot.quotePhase === "open" ? "realtime" : ""}`}><span />{sandboxOpen ? "情境演練" : quoteLabel}</span>
          <div className="mode-switch" aria-label="顯示模式">
            <button className={mode === "normal" ? "active" : ""} onClick={() => setMode("normal")}>一般</button>
            <button className={mode === "story" ? "active" : ""} onClick={() => setMode("story")}><BookOpenText size={14} />故事</button>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-grain" />
        <motion.div className="hero-ambient" aria-hidden="true" animate={{ x: [0, 38, 0], y: [0, -16, 0], opacity: [.45, .72, .45] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 22, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}>
          <div className={`mood-badge ${mood.tone}`}><span>{mood.icon}</span> 今日市場情緒 · {mood.label}</div>
          <p className="hero-kicker">TAIWAN STOCK MARKET × FARM STORY</p>
          <h1>把台股多空，<br /><em>種成一座戰場。</em></h1>
          <p className="hero-subtitle">今天的陽光、烏雲與收成，全部由市場說了算。走進農場，看牛熊如何爭奪每一道田埂。</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/battle">
              立即進入戰場 <ArrowRight size={18} />
            </Link>
            <button className="secondary-button" onClick={() => document.querySelector("#research")?.scrollIntoView({ behavior: "smooth" })}>
              <Search size={17} />查詢個股財報
            </button>
            <span className="hero-date"><small>{snapshot.date}</small>{snapshot.marketName}</span>
          </div>
        </motion.div>

        <motion.div className="hero-market-card" initial={{ opacity: 0, y: 28, scale: .98, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} transition={{ delay: .16, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}>
          <div className="market-card-header"><span>TAIEX{snapshot.quoteTime && <small>{snapshot.quoteTime} 更新</small>}</span><span className={`change-chip ${positive ? "up" : "down"}`}>{positive ? "▲" : "▼"} {Math.abs(snapshot.taiexChangePercent).toFixed(2)}%</span></div>
          <strong className="index-number"><NumberTicker value={snapshot.taiexClose} decimals={2} /></strong>
          <div className={`index-change ${positive ? "up" : "down"}`}>
            {positive ? "+" : ""}<NumberTicker value={snapshot.taiexChange} decimals={2} /> 點
          </div>
          <div className="mini-landscape" aria-hidden="true">
            <span className="mini-sun" /><span className="mini-hill one" /><span className="mini-hill two" />
            <span className="mini-barn">⌂</span><span className="mini-crops">〰 〰 〰</span>
          </div>
          <div className="market-card-footer"><span><i className="up-dot" />上漲 {snapshot.advancersCount}</span><span><i className="down-dot" />下跌 {snapshot.declinersCount}</span><span>平盤 {snapshot.unchangedCount}</span></div>
        </motion.div>
      </header>

      <StockResearch />

      <section className="battle-section" id="battle">
        <Reveal className="section-intro">
          <div><span className="eyebrow">LIVE FARM THEATER</span><h2>今日農場戰況</h2></div>
          <div className="scene-status">
            {sandboxOpen && <span className="sandbox-status"><WandSparkles size={16} />情境演練中</span>}
            <span><Sun size={16} />{scene.weatherLabel}</span><span><ShieldAlert size={16} />收割 Lv.{snapshot.harvestLevel}</span>
          </div>
        </Reveal>

        <Reveal className={`scene-frame ${sandboxOpen ? "is-sandbox" : ""}`}>
          <FarmScene snapshot={snapshot} focus={focus} onInspect={handleInspect} />
          <div className="scene-control-bar">
            <div className="scene-data-note"><Info size={16} /><span><strong>{snapshot.dataMessage}</strong><small>點擊角色與作物，找出 4 個市場線索</small></span></div>
            <div className="scene-control-actions">
              <div className="discovery-progress" aria-label={`場景探索進度 ${Math.min(discoveries.length, 4)} / 4`}>
                <span>探索 {Math.min(discoveries.length, 4)}/4</span>
                <div>{[0, 1, 2, 3].map((step) => <i className={discoveries.length > step ? "done" : ""} key={step} />)}</div>
              </div>
              <button className="refresh-button" onClick={refresh} disabled={loading || sandboxOpen} title={sandboxOpen ? "請先回到今日戰況" : undefined}>
                <RefreshCw size={17} className={loading ? "spin" : ""} />{loading ? "讀取風向…" : "重新整理戰況"}
              </button>
            </div>
          </div>

          <div className="experience-dock">
            <div className="experience-copy">
              <span className="dock-icon"><SlidersHorizontal size={19} /></span>
              <span><strong>如果市場突然變天？</strong><small>拖動情緒風向，立即看整座農場如何反應。</small></span>
            </div>
            <div className="experience-buttons">
              <button className={`sandbox-button ${sandboxOpen ? "active" : ""}`} onClick={sandboxOpen ? closeSandbox : openSandbox} aria-expanded={sandboxOpen}>
                {sandboxOpen ? <RotateCcw size={16} /> : <WandSparkles size={16} />}{sandboxOpen ? "回到今日" : "玩玩風向"}
              </button>
              <button className="share-button" onClick={shareBattle}><Share2 size={16} />分享戰況</button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {sandboxOpen && (
              <motion.section
                className="sandbox-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                aria-label="市場情緒情境沙盒"
              >
                <div className="sandbox-inner">
                  <div className="sandbox-heading">
                    <div><span className="sandbox-live"><i />SCENE LIVE</span><h3>市場情緒調音台</h3><p>這是視覺情境演練，不會覆蓋今日真實市場資料。</p></div>
                    <output className={sandboxScore >= 0 ? "positive" : "negative"} htmlFor="sentiment-sandbox">
                      <small>情緒風向</small><strong>{sandboxScore > 0 ? "+" : ""}{sandboxScore}</strong>
                    </output>
                  </div>
                  <div className="range-wrap">
                    <input
                      id="sentiment-sandbox"
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={sandboxScore}
                      onChange={(event) => setSandboxScore(Number(event.target.value))}
                      style={{ "--range-progress": `${(sandboxScore + 100) / 2}%` } as CSSProperties}
                      aria-valuetext={`市場情緒 ${sandboxScore}`}
                    />
                    <div className="range-labels"><span>風暴收割</span><span>田埂拉鋸</span><span>豐收慶典</span></div>
                  </div>
                  <div className="preset-list" aria-label="快速情境">
                    {sandboxPresets.map((preset) => (
                      <button key={preset.score} className={sandboxScore === preset.score ? "active" : ""} onClick={() => setSandboxScore(preset.score)} aria-pressed={sandboxScore === preset.score}>
                        <span aria-hidden="true">{preset.icon}</span><small>{preset.label}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {inspection && (
              <motion.div className="scene-tooltip" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}>
                <button onClick={() => setInspection(null)} aria-label="關閉說明">×</button>
                <span className="tooltip-icon"><Leaf size={18} /></span><div><strong>{inspection.title}</strong><p>{inspection.text}</p></div>
              </motion.div>
            )}
          </AnimatePresence>
        </Reveal>
        {refreshError && <p className="inline-error"><ShieldAlert size={15} />{refreshError}</p>}
      </section>

      <section className="dashboard-section">
        <Reveal className="power-grid">
          <PowerCard kind="bull" value={snapshot.bullPower} active={focus === "bull"} onClick={() => handleFocus("bull")} />
          <div className="sentiment-card">
            <div className="sentiment-header"><span><Gauge size={18} /> SENTIMENT</span><small>-100 — +100</small></div>
            <strong className={snapshot.sentimentScore >= 0 ? "up" : "down"}><NumberTicker value={snapshot.sentimentScore} /></strong>
            <div className="sentiment-scale"><i style={{ left: `${(snapshot.sentimentScore + 100) / 2}%` }} /><span>風暴</span><span>拉鋸</span><span>豐收</span></div>
          </div>
          <PowerCard kind="bear" value={snapshot.bearPower} active={focus === "bear"} onClick={() => handleFocus("bear")} />
        </Reveal>

        <Reveal className="metric-grid">
          <article><span className="metric-icon up"><Sprout /></span><div><small>上漲家數</small><strong><NumberTicker value={snapshot.advancersCount} /></strong></div><em>成熟作物</em></article>
          <article><span className="metric-icon down"><Leaf /></span><div><small>下跌家數</small><strong><NumberTicker value={snapshot.declinersCount} /></strong></div><em>彎腰作物</em></article>
          <article><span className="metric-icon"><BarChart3 /></span><div><small>成交量</small><strong>{formatMarketValue(snapshot.volume)}</strong></div><em>市場腳步</em></article>
          <article><span className="metric-icon gold"><Wheat /></span><div><small>成交值</small><strong>{formatMarketValue(snapshot.turnover)}</strong></div><em>今日穀倉</em></article>
        </Reveal>
      </section>

      <Reveal className={`narration-section ${mode}`}>
        <div className="narration-portrait"><span aria-hidden="true">🧑‍🌾</span><i /></div>
        <div className="narration-copy"><span className="eyebrow">FARMER&apos;S FIELD NOTE · 今日農夫旁白</span><blockquote>「{createNarration(snapshot, mode === "story")}」</blockquote><p><Sparkles size={15} /> {scene.advice}</p></div>
        <span className="quote-mark">“</span>
      </Reveal>

      <section className="market-sections">
        <Reveal className="section-heading-row"><div><span className="eyebrow">HARVEST BOARD</span><h2>今日作物榜</h2></div><p>漲跌幅換成農場收成，一眼看懂哪塊田正在發光。</p></Reveal>
        <div className="movers-grid">
          <Reveal><Movers title="豐收作物 Top 5" items={snapshot.topGainers} positive /></Reveal>
          <Reveal><Movers title="風雨作物 Top 5" items={snapshot.topLosers} positive={false} /></Reveal>
        </div>
      </section>

      <section className="trend-section">
        <Reveal className="section-heading-row"><div><span className="eyebrow">MARKET WEATHER TRACKER</span><h2>盤中風向軌跡</h2></div><p>沒有盤中序列時，以今日快照建立情緒節奏示意。</p></Reveal>
        <div className="chart-grid">
          <Reveal className="chart-card wide">
            <div className="chart-title"><div><small>情緒地形</small><h3>市場溫度變化</h3></div><span className={snapshot.sentimentScore >= 0 ? "up" : "down"}>{snapshot.sentimentScore >= 0 ? "偏暖" : "偏冷"}</span></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -25, bottom: 0 }}>
                  <defs><linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#76c66b" stopOpacity={0.5} /><stop offset="100%" stopColor="#76c66b" stopOpacity={0.02} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="rgba(50,70,50,.1)" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "#738070", fontSize: 11 }} />
                  <YAxis domain={[-100, 100]} tickLine={false} axisLine={false} tick={{ fill: "#8a9487", fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(60,80,60,.12)", boxShadow: "0 12px 32px rgba(30,40,30,.12)" }} />
                  <Area type="monotone" dataKey="sentiment" stroke="#3f7d44" strokeWidth={3} fill="url(#sentimentFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
          <Reveal className="chart-card">
            <div className="chart-title"><div><small>交戰線</small><h3>Bull vs Bear</h3></div><span>戰力 %</span></div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 8, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="rgba(50,70,50,.1)" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "#738070", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: "#8a9487", fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid rgba(60,80,60,.12)" }} />
                  <Line type="monotone" dataKey="bull" stroke="#5a9f4d" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="bear" stroke="#765d92" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="legend-section">
        <Reveal className="section-heading-row"><div><span className="eyebrow">FIELD GUIDE</span><h2>農場戰場圖鑑</h2></div><p>每個角色，都在替一種市場訊號說故事。</p></Reveal>
        <div className="legend-grid">
          {[
            ["☀️", "太陽", "多頭動能"], ["☁️", "烏雲", "空頭壓力"], ["🥬", "韭菜田", "散戶情緒"], ["🚜", "收割機", "急跌風險"],
            ["🐂", "牛隊長", "買盤推進"], ["🐻", "熊隊長", "賣壓進攻"], ["🌾", "豐收", "市場普漲"], ["🐦‍⬛", "烏鴉", "系統性壓力"],
          ].map(([icon, title, description], index) => (
            <motion.article key={title} whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 280 }}>
              <span className={`legend-icon color-${index % 4}`} aria-hidden="true">{icon}</span><div><strong>{title}</strong><small>{description}</small></div>
            </motion.article>
          ))}
        </div>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark"><Sprout size={20} /></span><div><strong>Farm Market Battle</strong><small>把數字變成一座會呼吸的農場。</small></div></div>
        <div className="footer-notes">
          <p>資料優先取自臺灣證券交易所 OpenAPI；服務不可用時自動使用示範資料。</p>
          <p><b>免責聲明</b>　本網站僅供資料視覺化與娛樂參考，不構成任何投資建議。</p>
          <span>最後更新 {updatedAt}（台北時間）· App v1.0.0 · {process.env.NEXT_PUBLIC_APP_ENV ?? "development"}</span>
        </div>
      </footer>
      <AnimatePresence>
        {toast && (
          <motion.div className={`ux-toast ${toast.tone}`} role="status" aria-live="polite" initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .97 }}>
            <span>{toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "✦"}</span>{toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

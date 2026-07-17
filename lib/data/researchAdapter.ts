import { mockFinancialReports, mockStockCatalog } from "@/lib/data/mockResearch";
import type { FinancialCategory, FinancialReport, StockSearchResult } from "@/lib/types/financial";

type TwseRow = Record<string, string>;

const TWSE_BASE_URL = "https://openapi.twse.com.tw/v1";

const industryNames: Record<string, string> = {
  "01": "水泥工業", "02": "食品工業", "03": "塑膠工業", "04": "紡織纖維", "05": "電機機械",
  "06": "電器電纜", "08": "玻璃陶瓷", "09": "造紙工業", "10": "鋼鐵工業", "11": "橡膠工業",
  "12": "汽車工業", "14": "建材營造", "15": "航運業", "16": "觀光餐旅", "17": "金融保險業",
  "18": "貿易百貨", "20": "其他業", "21": "化學工業", "22": "生技醫療業", "23": "油電燃氣業",
  "24": "半導體業", "25": "電腦及週邊設備業", "26": "光電業", "27": "通信網路業", "28": "電子零組件業",
  "29": "電子通路業", "30": "資訊服務業", "31": "其他電子業", "32": "數位雲端", "33": "居家生活",
  "34": "綠能環保", "35": "運動休閒",
};

const statementEndpoints: Record<FinancialCategory, { income: string; balance: string }> = {
  "一般業": { income: "t187ap06_L_ci", balance: "t187ap07_L_ci" },
  "金融業": { income: "t187ap06_L_basi", balance: "t187ap07_L_basi" },
  "金控業": { income: "t187ap06_L_fh", balance: "t187ap07_L_fh" },
  "保險業": { income: "t187ap06_L_ins", balance: "t187ap07_L_ins" },
  "證券期貨業": { income: "t187ap06_L_bd", balance: "t187ap07_L_bd" },
  "異業": { income: "t187ap06_L_mim", balance: "t187ap07_L_mim" },
};

const numberFrom = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const firstNumber = (row: TwseRow | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = numberFrom(row?.[key]);
    if (value !== null) return value;
  }
  return null;
};

const ratio = (numerator: number | null, denominator: number | null) =>
  numerator !== null && denominator ? Number((numerator / denominator * 100).toFixed(2)) : null;

const rocYearMonth = (value: string | undefined) => {
  if (!value || value.length !== 5) return null;
  return `${Number(value.slice(0, 3)) + 1911}-${value.slice(3)}`;
};

const rocDate = (value: string | undefined) => {
  if (!value || value.length !== 7) return new Date().toISOString().slice(0, 10);
  return `${Number(value.slice(0, 3)) + 1911}-${value.slice(3, 5)}-${value.slice(5)}`;
};

async function fetchRows(path: string, signal: AbortSignal): Promise<TwseRow[]> {
  const response = await fetch(`${TWSE_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error(`TWSE request failed (${response.status})`);
  return response.json() as Promise<TwseRow[]>;
}

function inferCategory(name: string, industry: string): FinancialCategory {
  if (name.endsWith("金") || name.includes("金控")) return "金控業";
  if (name.includes("銀") || industry.includes("銀行")) return "金融業";
  if (name.includes("證") || industry.includes("證券")) return "證券期貨業";
  if (name.includes("保") || name.includes("壽") || industry.includes("保險")) return "保險業";
  return "一般業";
}

export async function searchListedStocks(query: string): Promise<StockSearchResult[]> {
  const normalized = query.trim().toLocaleLowerCase("zh-TW");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const rows = await fetchRows("/exchangeReport/STOCK_DAY_ALL", controller.signal);
    return rows
      .filter((row) => /^\d{4}$/.test(row.Code ?? "") && Number(row.Code) >= 1100)
      .map((row): StockSearchResult => {
        const price = numberFrom(row.ClosingPrice) ?? 0;
        const change = numberFrom(row.Change) ?? 0;
        const previousClose = price - change;
        return {
          code: row.Code,
          name: row.Name || row.Code,
          price,
          change,
          changePercent: previousClose ? change / previousClose * 100 : 0,
          volume: numberFrom(row.TradeVolume) ?? 0,
          dataMode: "live",
        };
      })
      .filter((stock) => {
        const haystack = `${stock.code} ${stock.name.toLocaleLowerCase("zh-TW")}`;
        return tokens.length === 0 || tokens.every((token) => haystack.includes(token));
      })
      .slice(0, 12);
  } catch (error) {
    console.warn("Using demo stock catalog:", error);
    return mockStockCatalog
      .filter((stock) => !normalized || stock.code.includes(normalized) || stock.name.toLocaleLowerCase("zh-TW").includes(normalized))
      .slice(0, 12);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getFinancialReport(code: string): Promise<FinancialReport | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const [companyRows, revenueRows] = await Promise.all([
      fetchRows("/opendata/t187ap03_L", controller.signal),
      fetchRows("/opendata/t187ap05_L", controller.signal),
    ]);
    const company = companyRows.find((row) => row["公司代號"] === code);
    const name = company?.["公司簡稱"] || company?.["公司名稱"] || code;
    const rawIndustry = company?.["產業別"] || company?.["產業類別"] || "";
    const industry = industryNames[rawIndustry] || rawIndustry || "上市公司";
    const preferred = inferCategory(name, industry);
    const categories = [preferred, ...Object.keys(statementEndpoints).filter((item) => item !== preferred)] as FinancialCategory[];

    let category: FinancialCategory | null = null;
    let income: TwseRow | undefined;
    for (const candidate of categories) {
      const rows = await fetchRows(`/opendata/${statementEndpoints[candidate].income}`, controller.signal);
      income = rows.find((row) => row["公司代號"] === code);
      if (income) {
        category = candidate;
        break;
      }
    }
    if (!income || !category) throw new Error("Financial statement not found");

    const balanceRows = await fetchRows(`/opendata/${statementEndpoints[category].balance}`, controller.signal);
    const balance = balanceRows.find((row) => row["公司代號"] === code);
    const revenueRow = revenueRows.find((row) => row["公司代號"] === code);

    const revenue = firstNumber(income, ["營業收入", "淨收益", "利息淨收益", "收益"]);
    const grossProfit = firstNumber(income, ["營業毛利（毛損）淨額", "營業毛利（毛損）"]);
    const operatingIncome = firstNumber(income, ["營業利益（損失）", "繼續營業單位稅前損益"]);
    const netIncome = firstNumber(income, ["本期淨利（淨損）", "本期稅後淨利（淨損）", "繼續營業單位本期淨利（淨損）"]);
    const totalAssets = firstNumber(balance, ["資產總額", "資產總計"]);
    const totalLiabilities = firstNumber(balance, ["負債總額", "負債總計"]);
    const totalEquity = firstNumber(balance, ["權益總額", "權益總計"]);

    return {
      code,
      name: income["公司名稱"] || name,
      industry,
      category,
      period: `${Number(income["年度"] ?? "0") + 1911} Q${income["季別"] ?? "—"}`,
      reportDate: rocDate(income["出表日期"]),
      revenueMonth: rocYearMonth(revenueRow?.["資料年月"]),
      metrics: {
        revenue,
        grossProfit,
        operatingIncome,
        netIncome,
        eps: firstNumber(income, ["基本每股盈餘（元）"]),
        totalAssets,
        totalLiabilities,
        totalEquity,
        bookValuePerShare: firstNumber(balance, ["每股參考淨值"]),
        monthlyRevenue: firstNumber(revenueRow, ["營業收入-當月營收"]),
        monthlyRevenueMom: firstNumber(revenueRow, ["營業收入-上月比較增減(%)"]),
        monthlyRevenueYoy: firstNumber(revenueRow, ["營業收入-去年同月增減(%)"]),
      },
      ratios: {
        grossMargin: ratio(grossProfit, revenue),
        operatingMargin: ratio(operatingIncome, revenue),
        netMargin: ratio(netIncome, revenue),
        debtRatio: ratio(totalLiabilities, totalAssets),
      },
      note: revenueRow?.["備註"] || (category === "一般業" ? "最新一季合併財務報表摘要。" : "金融業損益結構與一般產業不同，部分比率不適用。"),
      dataMode: "live",
      dataMessage: "臺灣證券交易所／公開資訊觀測站最新資料",
    };
  } catch (error) {
    console.warn("Using demo financial report:", error);
    return mockFinancialReports[code] ?? null;
  } finally {
    clearTimeout(timeout);
  }
}

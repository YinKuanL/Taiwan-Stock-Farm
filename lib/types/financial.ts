export type FinancialCategory = "一般業" | "金融業" | "金控業" | "保險業" | "證券期貨業" | "異業";

export interface StockSearchResult {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  dataMode: "live" | "demo";
}

export interface FinancialMetrics {
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  eps: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  bookValuePerShare: number | null;
  monthlyRevenue: number | null;
  monthlyRevenueMom: number | null;
  monthlyRevenueYoy: number | null;
}

export interface FinancialRatios {
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  debtRatio: number | null;
}

export interface FinancialReport {
  code: string;
  name: string;
  industry: string;
  category: FinancialCategory;
  period: string;
  reportDate: string;
  revenueMonth: string | null;
  metrics: FinancialMetrics;
  ratios: FinancialRatios;
  note: string;
  dataMode: "live" | "demo";
  dataMessage: string;
}

export interface StockCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
}

export interface CandleSeries {
  code: string;
  name: string;
  candles: StockCandle[];
  dataMode: "live" | "demo";
  dataMessage: string;
}

export type RevenueStream = {
  name: string;
  color: string;
  amount: string;
  share: string;
  volume: string;
  avgRevenue: string;
  sharePercent: number;
};

export type RevenueOverview = {
  totalAmount: string;
  totalContext: string;
  /** Period the streams cover, e.g. "May 2019 to Sep 23, 2026". */
  period: string;
  ytdDelta?: {
    text: string;
    trend: "up" | "down";
  };
  streams: RevenueStream[];
};

export type RevenueTimeframe = "1y" | "ytd" | "max";

export type ChartGranularity = "month" | "quarter" | "year";

export type RevenueSummary = {
  actualUsd: number;
  actualAmount: string;
  /** Period the actual revenue covers, e.g. "Sep 2025 to Aug 2026". */
  actualPeriod: string;
  runRateUsd: number;
  runRate: string;
  /** The 3 full months the run rate averages, e.g. "Jun to Aug 2026". */
  runRatePeriod: string;
  /** The arithmetic behind the run rate, e.g. "$1,130,483 ÷ 92 days × 365 = $4,485,069". */
  runRateFormula: string;
  qoqDelta?: {
    pct: number;
    text: string;
    trend: "up" | "down";
    /** The 3 full months compared against, e.g. "Mar to May 2026". */
    previousPeriod: string;
    /** The arithmetic behind the delta, in average daily revenue. */
    formula: string;
  };
};

export type KpiCard = {
  title: string;
  value: string;
  subtext: string;
  /** Methodology and window, shown in the title's info tooltip. */
  tooltip: string;
  unavailable?: boolean;
  delta?: {
    value: string;
    unit: string;
    comparison: string;
  };
  trend?: "up" | "down";
};

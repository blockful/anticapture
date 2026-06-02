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
  ytdDelta?: {
    text: string;
    trend: "up" | "down";
  };
  streams: RevenueStream[];
};

export type KpiCard = {
  title: string;
  value: string;
  subtext: string;
  delta?: {
    value: string;
    unit: string;
    comparison: string;
  };
  trend?: "up" | "down";
};

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
  streams: RevenueStream[];
};

export type KpiCard = {
  title: string;
  value: string;
  subtext: string;
  trend?: "up" | "down";
};

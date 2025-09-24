import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { MetricWithKey } from "@/features/token-distribution/types";

export const initialMetrics = [
  MetricTypesEnum.DELEGATED_SUPPLY,
  MetricTypesEnum.CEX_SUPPLY,
  MetricTypesEnum.DEX_SUPPLY,
  MetricTypesEnum.LENDING_SUPPLY,
];

export interface MetricSchema {
  label: string;
  color: string;
  category: string;
  type: "BAR" | "LINE" | "SPORADIC_LINE" | "AREA";
  axis?: "primary" | "secondary";
}

export const metricsSchema = {
  DELEGATED_SUPPLY: {
    label: "Delegated",
    color: "#3B82F6",
    category: "SUPPLY",
    type: "AREA",
  },
  CEX_SUPPLY: {
    label: "CEX",
    color: "#FACC15",
    category: "SUPPLY",
    type: "AREA",
  },
  DEX_SUPPLY: {
    label: "DEX",
    color: "#4ADE80",
    category: "SUPPLY",
    type: "AREA",
  },
  LENDING_SUPPLY: {
    label: "Lending",
    color: "#A855F7",
    category: "SUPPLY",
    type: "AREA",
  },
  TOTAL_SUPPLY: {
    label: "Total",
    color: "#2DD4BF",
    category: "SUPPLY",
    type: "AREA",
  },
  CIRCULATING_SUPPLY: {
    label: "Circulating",
    color: "#A78BFA",
    category: "SUPPLY",
    type: "AREA",
  },
  DELEGATIONS: {
    label: "Delegated",
    color: "#93C5FD",
    category: "VOLUME",
    type: "BAR",
  },
  CEX_TOKENS: {
    label: "CEX Tokens",
    color: "#FDE047",
    category: "VOLUME",
    type: "BAR",
  },
  DEX_TOKENS: {
    label: "DEX Tokens",
    color: "#10B981",
    category: "VOLUME",
    type: "BAR",
  },
  LENDING_TOKENS: {
    label: "Lending Tokens",
    color: "#8B5CF6",
    category: "VOLUME",
    type: "BAR",
  },
  PROPOSALS_GOVERNANCE: {
    label: "Proposals",
    color: "#fff",
    category: "GOVERNANCE",
    type: "SPORADIC_LINE",
  },
  TREASURY: {
    label: "Treasury",
    color: "#CACACA",
    category: "GOVERNANCE",
    type: "AREA",
  },
  TOKEN_PRICE: {
    label: "Token Price",
    color: "#8884d8",
    category: "MARKET",
    type: "AREA",
    axis: "secondary",
  },
} as const;

/* This function is used to format the metrics by category */
export const formatMetricsByCategory = (
  metrics: Record<string, MetricSchema>,
): Record<string, MetricWithKey[]> => {
  return Object.entries(metrics).reduce(
    (grouped, [key, metric]) => {
      const metricKey = key;
      const { category } = metric;

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({ ...metric, key: metricKey });

      return grouped;
    },
    {} as Record<string, MetricWithKey[]>,
  );
};

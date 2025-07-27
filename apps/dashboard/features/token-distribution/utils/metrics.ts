import { MetricTypesEnum } from "@/shared/types/enums/metric-type";

export const initialMetrics = [
  MetricTypesEnum.DELEGATED_SUPPLY,
  MetricTypesEnum.CEX_SUPPLY,
  MetricTypesEnum.DEX_SUPPLY,
  MetricTypesEnum.LENDING_SUPPLY,
];

export const metricsSchema: Record<
  string,
  { label: string; color: string; category: string }
> = {
  DELEGATED_SUPPLY: {
    label: "Delegated Supply",
    color: "#3B82F6",
    category: "SUPPLY",
  },
  CEX_SUPPLY: {
    label: "CEX Supply",
    color: "#FB923C",
    category: "SUPPLY",
  },
  DEX_SUPPLY: {
    label: "DEX Supply",
    color: "#22C55E",
    category: "SUPPLY",
  },
  LENDING_SUPPLY: {
    label: "Lending Supply",
    color: "#A855F7",
    category: "SUPPLY",
  },
  TOTAL_SUPPLY: {
    label: "Total Supply",
    color: "#2DD4BF",
    category: "SUPPLY",
  },
  CIRCULATING_SUPPLY: {
    label: "Circulating Supply",
    color: "#A78BFA",
    category: "SUPPLY",
  },
  TREASURY: {
    label: "Treasury",
    color: "#FAFAFA",
    category: "GOVERNANCE",
  },
};

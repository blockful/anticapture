import { MetricTypesEnum } from "@/shared/types/enums/metric-type";

export const initialMetrics = [
  MetricTypesEnum.DELEGATED_SUPPLY,
  MetricTypesEnum.CEX_SUPPLY,
  MetricTypesEnum.DEX_SUPPLY,
  MetricTypesEnum.LENDING_SUPPLY,
  MetricTypesEnum.PROPOSALS,
  MetricTypesEnum.VOTES,
];

interface MetricSchema {
  label: string;
  color: string;
  category: string;
}

export const metricsSchema: Record<string, MetricSchema> = {
  DELEGATED_SUPPLY: {
    label: "Delegated",
    color: "#3B82F6",
    category: "SUPPLY",
  },
  CEX_SUPPLY: {
    label: "CEX",
    color: "#FB923C",
    category: "SUPPLY",
  },
  DEX_SUPPLY: {
    label: "DEX",
    color: "#22C55E",
    category: "SUPPLY",
  },
  LENDING_SUPPLY: {
    label: "Lending",
    color: "#A855F7",
    category: "SUPPLY",
  },
  TOTAL_SUPPLY: {
    label: "Total",
    color: "#2DD4BF",
    category: "SUPPLY",
  },
  CIRCULATING_SUPPLY: {
    label: "Circulating",
    color: "#A78BFA",
    category: "SUPPLY",
  },
  TREASURY: {
    label: "Treasury",
    color: "#FAFAFA",
    category: "GOVERNANCE",
  },
  PROPOSALS: {
    label: "Proposals",
    color: "#8884d8",
    category: "GOVERNANCE",
  },
  VOTES: {
    label: "Votes",
    color: "#8884d8",
    category: "GOVERNANCE",
  },
};

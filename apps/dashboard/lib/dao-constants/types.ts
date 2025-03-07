import { Address } from "viem";
import { DaoIdEnum } from "@/lib/types/daos";
import { MetricTypesEnum } from "../client/constants";

export type DaoConstants = {
  name: string;
  contracts: {
    governor: Address;
    token: Address;
    timelock: Address;
  };
  cancelFunction?: string;
  snapshot: string;
  rules: {
    delay: boolean;
    changeVote: boolean;
    timelock: boolean;
    cancelFunction: boolean;
  };
};

export enum ChainNameEnum {
  Ethereum = "ethereum",
}

export type DaoMetricsDayBucket = {
  date: string;
  daoId: DaoIdEnum;
  tokenId: Address;
  metricType: MetricTypesEnum;
  open: string;
  close: string;
  low: string;
  high: string;
  average: string;
  volume: string;
  count: number;
};

export type PriceEntry = [timestamp: number, value: number];

export interface TokenHistoricalDataMetrics {
  prices: PriceEntry[];
  market_caps: PriceEntry[];
  total_volumes: PriceEntry[];
}

export interface MultilineChartDataSetPoint {
  date: number;
  [key: string]: number;
}

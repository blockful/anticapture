import { Address } from "viem";
import { DaoIdEnum } from "@/lib/types/daos";
import { MetricTypesEnum } from "../client/constants";
import { RiskLevel } from "@/lib/enums";
import { StaticImageData } from "next/image";

export type DaoConstants = DaoConstantsInAnalysis | DaoConstantsFullySupported;

export type DaoConstantsInAnalysis = {
  name: string;
  icon: StaticImageData;
  inAnalysis: true;
};

export type DaoConstantsFullySupported = {
  name: string;
  icon: StaticImageData;
  inAnalysis: false;
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
  supportsLiquidTreasuryCall: boolean;
  governanceImplementation?: GovernanceImplementation;
  securityCouncil?: {
    isActive: boolean;
    multisig: {
      threshold: number;
      signers: number;
      externalLink: string;
    };
    expiration: {
      date: string;
      timestamp: number;
    };
  };
  attackProfitability: {
    riskLevel: RiskLevel;
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

export type GovernanceImplementation = {
  fields: GovernanceImplementationField[];
};

export type GovernanceImplementationField = {
  name: string;
  value: string;
  description: string;
  riskLevel: RiskLevel;
};

import { Address } from "viem";
import { DaoIdEnum } from "@/lib/types/daos";
import { MetricTypesEnum } from "@/lib/client/constants";
import { RiskLevel } from "@/lib/enums";
import { StaticImageData } from "next/image";
import { SupportStageEnum } from "@/lib/enums/SupportStageEnum";

// Existing types
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
  fields?: GovernanceImplementationField[];
};

export type GovernanceImplementationField = {
  name: string;
  value: string;
  description: string;
  riskLevel: RiskLevel;
};

// Base DAO information
interface BaseInfo {
  name: string;
  icon: StaticImageData;
  supportStage: SupportStageEnum;
  disableDaoPage?: boolean;
}

// Section configurations without data storage
export interface DaoInfoConfig {
  contracts?: {
    governor: Address;
    token: Address;
    timelock: Address;
  };
  cancelFunction?: string;
  snapshot?: string;
  rules?: {
    delay?: boolean;
    changeVote?: boolean;
    timelock?: boolean;
    cancelFunction?: boolean;
  };
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
      startDate: string;
      alertExpiration: number;
    };
  };
}

export interface AttackProfitabilityConfig {
  riskLevel?: RiskLevel;
  supportsLiquidTreasuryCall?: boolean;
}
export interface GovernanceImplementationConfig
  extends GovernanceImplementation {}

// Complete DAO configuration structure
export interface DaoConfiguration extends BaseInfo {
  daoInfo?: DaoInfoConfig;
  attackProfitability?: AttackProfitabilityConfig;
  governanceImplementation?: GovernanceImplementationConfig;
  tokenDistribution?: boolean;
  governanceActivity?: boolean;
  showSupport?: boolean;
}

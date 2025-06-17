import { ReactNode } from "react";
import { Address } from "viem";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import {
  RiskLevel,
  SupportStageEnum,
  GovernanceImplementationEnum,
} from "@/shared/types/enums";
import { DaoIconProps } from "@/shared/components/icons/types";

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
  fields?: Partial<
    Record<GovernanceImplementationEnum, GovernanceImplementationField>
  >;
};

export type GovernanceImplementationField = {
  value: string;
  description: string;
  riskLevel: RiskLevel;
  requirements?: string[];
};

// Base DAO information
interface BaseInfo {
  name: string;
  supportStage: SupportStageEnum;
  icon?: (props: DaoIconProps) => ReactNode;
  disableDaoPage?: boolean;
}

// Section configurations without data storage
export interface DaoOverviewConfig {
  chainId: number;
  contracts: {
    token: Address;
    governor?: Address;
    timelock?: Address;
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
  daoOverview: DaoOverviewConfig;
  attackProfitability?: AttackProfitabilityConfig;
  governanceImplementation?: GovernanceImplementationConfig;
  resilienceStages?: boolean;
  tokenDistribution?: boolean;
  governanceActivity?: boolean;
  showSupport?: {
    snapshotProposal: string;
    snapshotSpace: string;
  };
  riskAnalysis?: boolean;
}

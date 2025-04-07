import { Address } from "viem";
import { DaoIdEnum } from "@/lib/types/daos";
import { MetricTypesEnum } from "../client/constants";
import { RiskLevel } from "@/lib/enums";
import { StaticImageData } from "next/image";
import { SupportStageEnum } from "../enums/SupportStageEnum";

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

// Base configuration for any section
export interface SectionConfig {
  enabled: boolean;
}

// Base DAO information
interface BaseInfo {
  name: string;
  icon: StaticImageData;
  supportStage: SupportStageEnum;
  disableDaoPage?: boolean;
}

// Section configurations without data storage
export interface DaoInfoConfig extends SectionConfig {
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
    };
  };
}

export interface AttackProfitabilityConfig extends SectionConfig {
  riskLevel?: RiskLevel;
  supportsLiquidTreasuryCall?: boolean;
  blurChart?: boolean;
}
export interface GovernanceImplementationConfig extends SectionConfig,
    GovernanceImplementation {}

export interface TokenDistributionConfig extends SectionConfig {
  blurChart?: boolean;
  blurFields?: {
    [MetricTypesEnum.TOTAL_SUPPLY]: boolean;
    [MetricTypesEnum.CIRCULATING_SUPPLY]: boolean;
    [MetricTypesEnum.CEX_SUPPLY]: boolean;
    [MetricTypesEnum.DEX_SUPPLY]: boolean;
    [MetricTypesEnum.LENDING_SUPPLY]: boolean;
    [MetricTypesEnum.DELEGATED_SUPPLY]: boolean;
  };
}
export interface GovernanceActivityConfig extends SectionConfig {
  blurFields?: {
    [MetricTypesEnum.VOTES]: boolean;
    [MetricTypesEnum.PROPOSALS]: boolean;
    [MetricTypesEnum.ACTIVE_SUPPLY]: boolean;
    [MetricTypesEnum.AVERAGE_TURNOUT]: boolean;
    [MetricTypesEnum.TREASURY]: boolean;
  };
}
export interface ShowSupportConfig extends SectionConfig {}

// Complete DAO configuration structure
export interface DaoConfiguration extends BaseInfo {
  daoInfo?: DaoInfoConfig;
  attackProfitability?: AttackProfitabilityConfig;
  governanceImplementation?: GovernanceImplementationConfig;
  tokenDistribution?: TokenDistributionConfig;
  governanceActivity?: GovernanceActivityConfig;
  showSupport?: ShowSupportConfig;
}

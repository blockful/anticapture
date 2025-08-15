import { ReactNode } from "react";
import { Address, Chain } from "viem";
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
  riskExplanation?: string;
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
  chain: Chain;
  contracts: {
    token: Address;
    governor?: Address;
    timelock?: Address;
  };
  cancelFunction?: string;
  snapshot?: string;
  tally?: string;
  rules?: {
    delay?: boolean;
    changeVote?: boolean;
    timelock?: boolean;
    cancelFunction?: boolean;
    logic:
      | "For"
      | "For + Abstain"
      | "For + Abstain + Against"
      | "All Votes Cast";
    quorumCalculation: "Total Supply" | "Del. Supply";
    proposalThreshold?: string;
  };
  securityCouncil?: {
    isActive: boolean;
    vetoCouncilAddress: string;
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

export interface DaoAddresses {
  [DaoIdEnum.UNISWAP]: {
    UniTimelock: string;
    UniTokenDistributor: string;
    Univ3Uni: string;
  };
  [DaoIdEnum.ENS]: {
    ENSTokenTimelock: string;
    ENSDaoWallet: string;
    ENSColdWallet: string;
  };
  [DaoIdEnum.OPTIMISM]: {
    OptimismTimelock: string;
    OptimismTokenDistributor: string;
    OptimismUniv3Uni: string;
  };
  [DaoIdEnum.ARBITRUM]: {
    ArbitrumTimelock: string;
    ArbitrumTokenDistributor: string;
    ArbitrumDaoWallet: string;
  };
  [DaoIdEnum.GITCOIN]: {
    GTCWallet: string;
    GTCTimelock: string;
    GTCUniv3Uni: string;
  };
}

export interface AttackProfitabilityConfig {
  riskLevel?: RiskLevel;
  supportsLiquidTreasuryCall?: boolean;
  attackCostBarChart: DaoAddresses[DaoIdEnum];
  dynamicQuorum?: {
    percentage: number;
  };
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
  dataTables?: boolean;
  showSupport?: {
    snapshotProposal: string;
    snapshotSpace: string;
  };
  riskAnalysis?: boolean;
  noStage?: boolean;
}

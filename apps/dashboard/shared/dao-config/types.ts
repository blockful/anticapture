import { ReactNode, SVGProps } from "react";
import { Address, Chain } from "viem";
import {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";
import { DaoIconProps } from "@/shared/components/icons/types";
import { MetricTypesEnum } from "../types/enums/metric-type";

export type TokenMetricItem = {
  date: string;
  high: string;
  volume: string;
};

export type PriceEntry = { timestamp: number; price: string };

export interface MultilineChartDataSetPoint {
  date: number;
  [key: string]: number | null;
}

export interface ChartDataSetPoint {
  date: number;
  [key: string]: number | string | undefined;
}

export type GovernanceImplementation = {
  fields?: Partial<
    Record<GovernanceImplementationEnum, GovernanceImplementationField>
  >;
};

export type GovernanceImplementationField = {
  riskLevel: RiskLevel;
  currentSetting?: string;
  description?: string;
  impact?: string;
  recommendedSetting?: string;
  nextStep?: string;
  value?: string;
  requirements?: string[];
  riskExplanation?: string;
};

// Base DAO information
interface BaseInfo {
  name: string;
  decimals: number;
  forumLink?: string;
  color: {
    svgColor: string;
    svgBgColor: string;
  };
  icon?: (props: DaoIconProps) => ReactNode;
  disableDaoPage?: boolean;
  notSupportedMetrics?: MetricTypesEnum[];
}

export interface ChainWithIcon extends Chain {
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
  blockTime: number;
}

// Section configurations without data storage
export interface DaoOverviewConfig {
  chain: ChainWithIcon;
  contracts: {
    token: Address;
    governor?: Address;
    timelock?: Address;
  };
  govPlatform?: {
    name: string;
    url: string;
  };
  token: "ERC20" | "ERC721";
  cancelFunction?: string;
  snapshot?: string;
  priceDisclaimer?: string;
  rules: {
    delay: boolean;
    changeVote: boolean;
    timelock: boolean;
    cancelFunction: boolean;
    logic:
      | "For"
      | "For + Abstain"
      | "For + Abstain + Against"
      | "All Votes Cast";
    quorumCalculation: string;
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

export interface AttackProfitabilityConfig {
  supportsLiquidTreasuryCall?: boolean;
  riskLevel?: RiskLevel;
  dynamicQuorum?: {
    percentage: number;
  };
}

export type DefenseAreaDescription = {
  description: string;
};

export type AttackExposureConfig = {
  defenseAreas?: Partial<Record<RiskAreaEnum, DefenseAreaDescription>>;
};

export interface GovernanceImplementationConfig extends GovernanceImplementation {}

// Complete DAO configuration structure
export interface DaoConfiguration extends BaseInfo {
  daoOverview: DaoOverviewConfig;
  attackProfitability?: AttackProfitabilityConfig;
  governanceImplementation?: GovernanceImplementationConfig;
  attackExposure?: AttackExposureConfig;
  resilienceStages?: boolean;
  tokenDistribution?: boolean;
  dataTables?: boolean;
  riskAnalysis?: boolean;
  noStage?: boolean;
  governancePage?: boolean;
}

import type { ReactNode, SVGProps } from "react";
import type { Address, Chain } from "viem";

import type { DaoIconProps } from "@/shared/components/icons/types";
import type {
  RiskLevel,
  GovernanceImplementationEnum,
  RiskAreaEnum,
} from "@/shared/types/enums";
import type { MetricTypesEnum } from "@/shared/types/enums/metric-type";

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
  description: string;

  requirements?: string[]; // Remove this when update Risk Analysis and Stages to not rely on it

  currentSetting?: string;
  impact?: string;
  recommendedSetting?: string;
  nextStep?: string;
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
  ogIcon: (props: { size: number }) => ReactNode;
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
    token: Address | { label: string; address: Address }[];
    governor?: Address;
    timelock?: Address;
    votingStrategy?: Address;
  };
  govPlatform?: {
    name: string;
    url: string;
  };
  token: "ERC20" | "ERC721";
  cancelFunction?: string;
  snapshot?: string;
  priceDisclaimer?: string;
  rules?: {
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
export type GovernanceImplementationConfig = GovernanceImplementation;

export interface WhitelabelConfig {
  theme: "light" | "dark";
  requestFeatureUrl?: string;
  customDomain?: string;
  forumBaseUrl?: string;
  branding?: {
    appName?: string;
    logo?: (props: DaoIconProps) => ReactNode;
  };
  governanceParameters?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  hostnames: string[];
}

export type DefenseAreaDescription = {
  description: string;
};

export type AttackExposureConfig = {
  defenseAreas?: Partial<Record<RiskAreaEnum, DefenseAreaDescription>>;
};

/** Feature page slugs — the set of pages a DAO can enable. */
export type DaoFeaturePageSlug =
  | "holders-and-delegates"
  | "governance"
  | "activity-feed"
  | "service-providers"
  | "attack-profitability"
  | "resilience-stages"
  | "risk-analysis"
  | "token-distribution";

// Complete DAO configuration structure
export interface DaoConfiguration extends BaseInfo {
  daoOverview: DaoOverviewConfig;
  whitelabel?: WhitelabelConfig;
  activityFeed?: boolean;
  attackProfitability?: AttackProfitabilityConfig;
  governanceImplementation?: GovernanceImplementationConfig;
  attackExposure?: AttackExposureConfig;
  resilienceStages?: boolean;
  tokenDistribution?: boolean;
  dataTables?: boolean;
  riskAnalysis?: boolean;
  noStage?: boolean;
  governancePage?: boolean;
  serviceProviders?: boolean;
  offchainProposals?: boolean;
  /** When false, hides the DAO Overview page from navigation. Defaults to true. */
  overviewPage?: boolean;
  /** When set, visiting /{daoId}/ redirects to /{daoId}/{initialPage}. */
  initialPage?: DaoFeaturePageSlug;
}

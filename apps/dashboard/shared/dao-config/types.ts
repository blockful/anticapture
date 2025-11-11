import { ReactNode } from "react";
import { Address, Chain } from "viem";
import { DaoIdEnum } from "@/shared/types/daos";
import { MetricTypesEnum } from "@/shared/types/enums/metric-type";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { DaoIconProps } from "@/shared/components/icons/types";
import { TreasuryAssetNonDaoToken } from "@/features/attack-profitability/hooks";

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

export type PriceEntry = { timestamp: number; price: string };

export interface MultilineChartDataSetPoint {
  date: number;
  [key: string]: number;
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
  value: string;
  description: string;
  riskLevel: RiskLevel;
  requirements?: string[];
  riskExplanation?: string;
};

// Base DAO information
interface BaseInfo {
  name: string;
  forumLink?: string;
  color: {
    svgColor: string;
    svgBgColor: string;
  };
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
  token: "ERC20" | "ERC721";
  cancelFunction?: string;
  snapshot?: string;
  tally?: string;
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
  [DaoIdEnum.GITCOIN]: {
    GTCWallet: string;
    GTCTimelock: string;
    GTCUniv3Uni: string;
  };
  [DaoIdEnum.NOUNS]: {
    NounsTimelock: string;
    PayerContract: string;
    ClientIncentivesRewardsProxy: string;
  };
  [DaoIdEnum.SCR]: Record<string, string>;
  [DaoIdEnum.COMP]: {
    Timelock: Address;
    Comptroller: Address;
    v2WBTC: Address;
    v2USDC: Address;
    v2DAI: Address;
    v2USDT: Address;
    v2ETH: Address;
    v2UNI: Address;
    v2BAT: Address;
    v2LINK: Address;
    v2TUSD: Address;
    v2AAVE: Address;
    v2COMP: Address;
    mainnetETH: Address;
    mainnetstETH: Address;
    mainnetUSDT: Address;
    mainnetUSDS: Address;
    mainnetUSDC: Address;
    mainnetWBTC: Address;
    opETH: Address;
    opUSDT: Address;
    opUSDC: Address;
    uniUSDC: Address;
    uniETH: Address;
    polyUSDT0: Address;
    polyUSDC: Address;
    ronWETH: Address;
    ronRON: Address;
    manUSDe: Address;
    baseUSDbC: Address;
    baseUSDC: Address;
    baseAERO: Address;
    baseUSDS: Address;
    baseETH: Address;
    arbUSDT0: Address;
    arbUSDC: Address;
    "arbUSDC.e": Address;
    arbETH: Address;
    linUSDC: Address;
    linETH: Address;
    scrUSDC: Address;
  };
  [DaoIdEnum.OBOL]: Record<string, string>;
}

export interface AttackProfitabilityConfig {
  riskLevel?: RiskLevel;
  liquidTreasury?: TreasuryAssetNonDaoToken; // FIXME(DEV-161): Remove once treasury fetching from Octav is operational
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
  riskAnalysis?: boolean;
  noStage?: boolean;
  governancePage?: boolean;
}

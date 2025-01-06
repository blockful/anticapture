import { User } from "@/lib/server/utils";
import { DaoName } from "./types/daos";

export type DashboardDao = {
  dao: string;
  delegatedSupply: string | null;
  profitability: string | null;
  delegatesToPass: string | null;
};

export type TokenDistribution = {
  metric: string | null;
  currentValue: string | null;
  variation: string | null;
};

export type GovernanceActivity = {
  metric: string | null;
  average: string | null;
  variation: string | null;
};

export type Delegates = {
  amount: number;
  delegators: number;
  voted: number;
  user: User;
};

export const IsDelegated = {
  Yes: "Yes",
  No: "No",
} as const;

export type IsDelegated = (typeof IsDelegated)[keyof typeof IsDelegated];

export type Holders = {
  amount: number;
  delegated: IsDelegated;
  lastBuy: Date;
  user: User;
};

export const tokenDistributionData: TokenDistribution[] = [
  {
    metric: "Total Supply",
    currentValue: null,
    variation: null,
  },
  {
    metric: "Delegated Supply",
    currentValue: null,
    variation: null,
  },
  {
    metric: "Circulating Supply",
    currentValue: null,
    variation: null,
  },
  {
    metric: "CEX Supply",
    currentValue: null,
    variation: null,
  },
  {
    metric: "DEX Supply",
    currentValue: null,
    variation: null,
  },
  {
    metric: "Lending Supply",
    currentValue: null,
    variation: null,
  },
];

export const dashboardData: DashboardDao[] = [
  {
    dao: DaoName.UNISWAP,
    delegatedSupply: null,
    profitability: null,
    delegatesToPass: null,
  },
  {
    dao: DaoName.ENS,
    delegatedSupply: null,
    profitability: null,
    delegatesToPass: null,
  },
];

export const enum GovernanceActivityMetrics {
  PROPOSALS = "Proposals",
  ACTIVE_SUPPLY = "Active Supply",
  VOTES = "Votes",
  AVERAGE_TURNOUT = "Average Turnout",
}

export const governanceActivityData: GovernanceActivity[] = [
  {
    metric: "Proposals",
    average: null,
    variation: null,
  },
  {
    metric: "Active Supply",
    average: null,
    variation: null,
  },
  {
    metric: "Votes",
    average: null,
    variation: null,
  },
  {
    metric: "Average Turnout",
    average: null,
    variation: null,
  },
];

export const delegatesData: Delegates[] = [
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 1200000,
    delegators: 2000,
    voted: 0.96,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 200100000,
    delegators: 1000,
    voted: 0.6,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    delegators: 500,
    voted: 0.76,
  },
];

export const holdersData: Holders[] = [
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 120000000,
    lastBuy: new Date(180000000000),
    delegated: IsDelegated.No,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 20000000,
    lastBuy: new Date(180000000000),
    delegated: IsDelegated.No,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180050000000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000300000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180200000000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000050000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180500000000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000001000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000000900),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000500000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(185000000000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000000600),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000600000),
    delegated: IsDelegated.No,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180007000000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000000800),
    delegated: IsDelegated.No,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180000000000),
    delegated: IsDelegated.No,
  },
  {
    user: {
      walletAddress: "0xFAFaC5F0571aa0F12A156FFdCD37E8a7dd694c4F",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180600000000),
    delegated: IsDelegated.Yes,
  },
  {
    user: {
      walletAddress: "0xBbCdd0B478E9c2a34b779C27AA17Db4bA7DBa7cf",
      ensName: null,
    },
    amount: 10000000,
    lastBuy: new Date(180040000000),
    delegated: IsDelegated.No,
  },
];

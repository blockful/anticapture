import { User } from "@/lib/server/utils";

export type TokenDistribution = {
  metric: string | undefined;
  currentValue: string | undefined;
  variation: string | undefined;
};

export type GovernanceActivity = {
  metric: string | undefined;
  average: string | undefined;
  variation: string | undefined;
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
    currentValue: undefined,
    variation: undefined,
  },
  {
    metric: "Delegated Supply",
    currentValue: undefined,
    variation: undefined,
  },
  {
    metric: "Circulating Supply",
    currentValue: undefined,
    variation: undefined,
  },
  {
    metric: "CEX Supply",
    currentValue: undefined,
    variation: undefined,
  },
  {
    metric: "DEX Supply",
    currentValue: undefined,
    variation: undefined,
  },
  {
    metric: "Lending Supply",
    currentValue: undefined,
    variation: undefined,
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
    average: undefined,
    variation: undefined,
  },
  {
    metric: "Active Supply",
    average: undefined,
    variation: undefined,
  },
  {
    metric: "Votes",
    average: undefined,
    variation: undefined,
  },
  {
    metric: "Average Turnout",
    average: undefined,
    variation: undefined,
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

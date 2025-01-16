import { User } from "@/lib/server/utils";
import { DaoId } from "@/lib/types/daos";

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
  chartLastDays?: string;
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
    chartLastDays: undefined,
  },
  {
    metric: "Delegated Supply",
    currentValue: null,
    variation: null,
    chartLastDays: undefined,
  },
  {
    metric: "Circulating Supply",
    currentValue: null,
    variation: null,
    chartLastDays: undefined,
  },
  {
    metric: "CEX Supply",
    currentValue: null,
    variation: null,
    chartLastDays: undefined,
  },
  {
    metric: "DEX Supply",
    currentValue: null,
    variation: null,
    chartLastDays: undefined,
  },
  {
    metric: "Lending Supply",
    currentValue: null,
    variation: null,
    chartLastDays: undefined,
  },
];

export const dashboardData: DashboardDao[] = [
  {
    dao: DaoId.UNISWAP,
    delegatedSupply: null,
    profitability: null,
    delegatesToPass: null,
  },
  {
    dao: DaoId.ENS,
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
    metric: "Treasury",
    average: null,
    variation: null,
  },
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

export interface ChartMetrics {
  date: string;
  high: string;
}

export const chartMetrics: ChartMetrics[] = [
  {
    date: "1736294400000",
    high: "196525268429952772970493008",
  },
  {
    date: "1736208000000",
    high: "198625260369467534725057182",
  },
  {
    date: "1736121600000",
    high: "198622524954852654766707160",
  },
  {
    date: "1736035200000",
    high: "198627737196287031573770615",
  },
  {
    date: "1735948800000",
    high: "198627889884685416056723099",
  },
  {
    date: "1735862400000",
    high: "198627836438234008940432722",
  },
  {
    date: "1735776000000",
    high: "198844024746312782732696282",
  },
  {
    date: "1735689600000",
    high: "198844457818957204033112010",
  },
  {
    date: "1735603200000",
    high: "198847624577754100950807698",
  },
  {
    date: "1735516800000",
    high: "199021951646369930881678088",
  },
  {
    date: "1735430400000",
    high: "199021909118940290374874690",
  },
  {
    date: "1735344000000",
    high: "199022122731244248349283521",
  },
  {
    date: "1735257600000",
    high: "199122565846608615757764492",
  },
  {
    date: "1735171200000",
    high: "199122853151225593247371649",
  },
  {
    date: "1735084800000",
    high: "199122086863529802688454968",
  },
  {
    date: "1734998400000",
    high: "199221864891805375760938866",
  },
  {
    date: "1734912000000",
    high: "199221441507478842019560828",
  },
  {
    date: "1734825600000",
    high: "199298336875822160491401376",
  },
  {
    date: "1734739200000",
    high: "199399124802978922998815875",
  },
  {
    date: "1734652800000",
    high: "199370897979613653253501703",
  },
  {
    date: "1734566400000",
    high: "199572462109760076132482290",
  },
  {
    date: "1734480000000",
    high: "200634792548489903371257091",
  },
  {
    date: "1734393600000",
    high: "200666148912083674051008567",
  },
  {
    date: "1734307200000",
    high: "200657270032422126922635932",
  },
  {
    date: "1734220800000",
    high: "202660284123696698858916706",
  },
  {
    date: "1734134400000",
    high: "202665619989468995158048429",
  },
  {
    date: "1734048000000",
    high: "202665523556916661539487624",
  },
  {
    date: "1733961600000",
    high: "202665990900118931168145252",
  },
  {
    date: "1733875200000",
    high: "202666517298361917578765546",
  },
  {
    date: "1733788800000",
    high: "202668915287396862006645008",
  },
  {
    date: "1733702400000",
    high: "202726042763852635409767773",
  },
  {
    date: "1733616000000",
    high: "202759982973192299529164891",
  },
  {
    date: "1733529600000",
    high: "202761247803012530455709682",
  },
  {
    date: "1733443200000",
    high: "202800887925756684481337360",
  },
  {
    date: "1733356800000",
    high: "202847867453029290642479487",
  },
  {
    date: "1733270400000",
    high: "202846868635824406295751805",
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

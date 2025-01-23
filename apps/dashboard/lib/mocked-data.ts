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
  currentValue?: string | null;
  variation?: string | null;
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
  // {
  //   dao: DaoId.ENS,
  //   delegatedSupply: null,
  //   profitability: null,
  //   delegatesToPass: null,
  // },
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

export const daoMetricsDayBuckets = {
  data: {
    daoMetricsDayBucketss: {
      totalCount: 828563,
      items: [
        {
          date: "1646278150",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DELEGATED_SUPPLY",
          open: "201892518980032609448879505",
          close: "201892520538464439448879505",
          low: "201892518980032609448879505",
          high: "201892520538464439448879505",
          average: "201892520538464439448879505",
          volume: "1558431830000000000",
          count: 1,
        },
        {
          date: "1646278029",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022267265588283760141925",
          close: "8022007566955806431800921",
          low: "8022007566955806431800921",
          high: "8022267265588283760141925",
          average: "8022007566955806431800921",
          volume: "259698632477328341004",
          count: 1,
        },
        {
          date: "1646277336",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DELEGATED_SUPPLY",
          open: "201892516980032609448879505",
          close: "201892518980032609448879505",
          low: "201892516980032609448879505",
          high: "201892518980032609448879505",
          average: "201892518980032609448879505",
          volume: "2000000000000000000",
          count: 1,
        },
        {
          date: "1646277185",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "CEX_SUPPLY",
          open: "59003025685673975199682944",
          close: "59002964450862515199682944",
          low: "59002964450862515199682944",
          high: "59003025685673975199682944",
          average: "59002964450862515199682944",
          volume: "61234811460000000000",
          count: 1,
        },
        {
          date: "1646277063",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022262865588283760141925",
          close: "8022267265588283760141925",
          low: "8022262865588283760141925",
          high: "8022267265588283760141925",
          average: "8022267265588283760141925",
          volume: "4400000000000000000",
          count: 1,
        },
        {
          date: "1646276200",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DELEGATED_SUPPLY",
          open: "201892522005032538139608678",
          close: "201892516980032609448879505",
          low: "201892516980032609448879505",
          high: "201892522005032538139608678",
          average: "201892516980032609448879505",
          volume: "5024999928690729173",
          count: 1,
        },
        {
          date: "1646276139",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022062667007508706351019",
          close: "8022262865588283760141925",
          low: "8022062667007508706351019",
          high: "8022262865588283760141925",
          average: "8022262865588283760141925",
          volume: "200198580775053790906",
          count: 1,
        },
        {
          date: "1646276122",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022689484168673284582314",
          close: "8022062667007508706351019",
          low: "8022062667007508706351019",
          high: "8022582613550085158952089",
          average: "8022322640278796932651554",
          volume: "626817161164578231295",
          count: 2,
        },
        {
          date: "1646275939",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022688484168673284582314",
          close: "8022689484168673284582314",
          low: "8022688484168673284582314",
          high: "8022689484168673284582314",
          average: "8022689484168673284582314",
          volume: "1000000000000000000",
          count: 1,
        },
        {
          date: "1646275637",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022534653171140281712516",
          close: "8022688484168673284582314",
          low: "8022534653171140281712516",
          high: "8022688484168673284582314",
          average: "8022688484168673284582314",
          volume: "153830997533002869798",
          count: 1,
        },
        {
          date: "1646275560",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DELEGATED_SUPPLY",
          open: "201892516980032609448879505",
          close: "201892522005032538139608678",
          low: "201892516980032609448879505",
          high: "201892522005032538139608678",
          average: "201892522005032538139608678",
          volume: "5024999928690729173",
          count: 1,
        },
        {
          date: "1646275433",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022603795129657555629815",
          close: "8022534653171140281712516",
          low: "8022534653171140281712516",
          high: "8022603795129657555629815",
          average: "8022534653171140281712516",
          volume: "69141958517273917299",
          count: 1,
        },
        {
          date: "1646275343",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "CEX_SUPPLY",
          open: "59003391685673975199682944",
          close: "59003025685673975199682944",
          low: "59003025685673975199682944",
          high: "59003391685673975199682944",
          average: "59003025685673975199682944",
          volume: "366000000000000000000",
          count: 1,
        },
        {
          date: "1646275149",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8022503795129657555629815",
          close: "8022603795129657555629815",
          low: "8022503795129657555629815",
          high: "8022603795129657555629815",
          average: "8022603795129657555629815",
          volume: "100000000000000000000",
          count: 1,
        },
        {
          date: "1646274829",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8019396112260898515212578",
          close: "8022503795129657555629815",
          low: "8019396112260898515212578",
          high: "8022503795129657555629815",
          average: "8022503795129657555629815",
          volume: "3107682868759040417237",
          count: 1,
        },
        {
          date: "1646274803",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8015960477743132017580322",
          close: "8019396112260898515212578",
          low: "8015960477743132017580322",
          high: "8019396112260898515212578",
          average: "8019396112260898515212578",
          volume: "3435634517766497632256",
          count: 1,
        },
        {
          date: "1646274754",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8013652077251935883144708",
          close: "8015960477743132017580322",
          low: "8013652077251935883144708",
          high: "8015960477743132017580322",
          average: "8015960477743132017580322",
          volume: "2308400491196134435614",
          count: 1,
        },
        {
          date: "1646274698",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DEX_SUPPLY",
          open: "8013160141768064915320324",
          close: "8013652077251935883144708",
          low: "8013160141768064915320324",
          high: "8013652077251935883144708",
          average: "8013652077251935883144708",
          volume: "491935483870967824384",
          count: 1,
        },
        {
          date: "1646274459",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "DELEGATED_SUPPLY",
          open: "201892516970032609448879505",
          close: "201892516980032609448879505",
          low: "201892516970032609448879505",
          high: "201892516980032609448879505",
          average: "201892516980032609448879505",
          volume: "10000000000000000",
          count: 1,
        },
        {
          date: "1646273499",
          daoId: "UNI",
          tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          metricType: "CEX_SUPPLY",
          open: "59003405648313975199682944",
          close: "59003391685673975199682944",
          low: "59003391685673975199682944",
          high: "59003405648313975199682944",
          average: "59003391685673975199682944",
          volume: "13962640000000000000",
          count: 1,
        },
      ],
    },
  },
};

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

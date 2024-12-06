import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { Address } from "viem";

export interface DAO {
  activeDelegatesCount: number;
  activeVotingPower: number;
  id: string;
  proposalThreshold: number;
  quorum: number;
  timelockDelay: number;
  totalDelegatesCount: number;
  totalSupply: number;
  totalVotingPower: number;
  votingDelay: number;
  votingPeriod: number;
  averageApprovalVotes: string;
  averageTurnout: string;
  attackCosts: {
    activeVotingPowerCost: string;
    averageTurnoutCost: string;
    topActiveDelegatesForActiveVotingPower: number;
    topActiveDelegatesForAverageTurnout: number;
    topActiveDelegatesForTotalVotingPower: number;
    topDelegatesForActiveVotingPower: number;
    topDelegatesForAverageTurnout: number;
    topDelegatesForTotalVotingPower: number;
    totalVotingPowerCost: string;
  };
}

export interface DAOVotingPower {
  dao: string;
  totalDelegatedVotingPower: number;
}

export enum DaoName {
  UNISWAP = "UNI",
}

export const fetchDaoData = async (
  daoName: DaoName,
  activeSince: number,
  avgFromDate: number
) => {
  return new Promise(async (res, rej) => {
    try {
      const daoData = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoName}?activeSince=${activeSince}&avgFromDate=${avgFromDate}`
      );

      res(daoData);
    } catch (e) {
      rej(e);
    }
  });
};

export enum ChainName {
  Ethereum = "ethereum",
}

export const TokenContract: Record<DaoName, Address> = {
  [DaoName.UNISWAP]: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
};

/* Fetch Dao Token price from Defi Llama API */
export const fetchTokenPrice = async (
  chainName: ChainName,
  daoName: DaoName
) => {
  const daoToken = TokenContract[daoName];

  try {
    const url = `https://coins.llama.fi/prices/current/${chainName}:${daoToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.coins) {
      const tokenData = data.coins[`${chainName}:${daoToken}`];
      return tokenData.price;
    } else {
      throw new Error("Token price not found");
    }
  } catch (error) {
    throw new Error("Error fetching token price:");
  }
};

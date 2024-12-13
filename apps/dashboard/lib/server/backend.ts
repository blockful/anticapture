import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { Address } from "viem";

export interface DAO {
  id: DaoName;
  quorum: number;
  proposalThreshold: number;
  votingDelay: number;
  votingPeriod: number;
  timelockDelay: number;
  totalSupply: number;
}

export interface DAOVotingPower {
  dao: string;
  totalDelegatedVotingPower: number;
}

export enum DaoName {
  UNISWAP = "UNI",
}

export const fetchDaoData = async (daoName: DaoName) => {
  return new Promise(async (res, rej) => {
    try {
      const daoData = await fetch(`${BACKEND_ENDPOINT}/dao/${daoName}`);

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
  daoName: DaoName,
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

interface TotalSupplyPromise {
  oldTotalSupply: string;
  currentTotalSupply: string;
  changeRate: string;
}

/* Fetch Dao Total Supply */
export const fetchTotalSupply = async ({
  daoName,
  timeInterval,
}: {
  daoName: DaoName;
  timeInterval: string;
}) => {
  return new Promise<TotalSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoName}/total-supply/compare?timeInterval=${timeInterval}`,
      );
      const totalSupplyData = await response.json();
      res(totalSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface DelegatedSupplyPromise {
  oldDelegatedSupply: string;
  currentDelegatedSupply: string;
  changeRate: string;
}

/* Fetch Dao Total Supply */
export const fetchDelegatedSupply = async ({
  daoName,
  timeInterval,
}: {
  daoName: DaoName;
  timeInterval: string;
}) => {
  return new Promise<DelegatedSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoName}/delegated-supply/compare?timeInterval=${timeInterval}`,
      );
      const delegatedSupplyData = await response.json();
      console.log("delegatedSupplyData", delegatedSupplyData);
      res(delegatedSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

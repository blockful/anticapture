import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoName, TokenContract } from "@/lib/types/daos";

export interface DAOVotingPower {
  dao: string;
  totalDelegatedVotingPower: number;
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
        { next: { revalidate: 3600 } },
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
        { next: { revalidate: 3600 } },
      );
      const delegatedSupplyData = await response.json();
      res(delegatedSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface CirculatingSupplyPromise {
  oldCirculatingSupply: string;
  currentCirculatingSupply: string;
  changeRate: string;
}

/* Fetch Dao Circulating Supply */
export const fetchCirculatingSupply = async ({
  daoName,
  timeInterval,
}: {
  daoName: DaoName;
  timeInterval: string;
}) => {
  return new Promise<CirculatingSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoName}/circulating-supply/compare?timeInterval=${timeInterval}`,
        { next: { revalidate: 3600 } },
      );
      const circulatingSupplyData = await response.json();
      res(circulatingSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface CexSupplyPromise {
  oldCexSupply: string;
  currentCexSupply: string;
  changeRate: string;
}

/* Fetch Dao Cex Supply */
export const fetchCexSupply = async ({
  daoName,
  timeInterval,
}: {
  daoName: DaoName;
  timeInterval: string;
}) => {
  return new Promise<CexSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoName}/cex-supply/compare?timeInterval=${timeInterval}`,
        { next: { revalidate: 3600 } },
      );
      const cexSupplyData = await response.json();
      res(cexSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface DexSupplyPromise {
  oldDexSupply: string;
  currentDexSupply: string;
  changeRate: string;
}

/* Fetch Dao Dex Supply */
export const fetchDexSupply = async ({
  daoName,
  timeInterval,
}: {
  daoName: DaoName;
  timeInterval: string;
}) => {
  return new Promise<DexSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoName}/dex-supply/compare?timeInterval=${timeInterval}`,
        { next: { revalidate: 3600 } },
      );
      const dexSupplyData = await response.json();
      res(dexSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

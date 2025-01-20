import { DaoId, TokenContract } from "@/lib/types/daos";

export interface DAOVotingPower {
  dao: string;
  totalDelegatedVotingPower: number;
}

export const fetchDaoData = async (daoId: DaoId) => {
  return new Promise(async (res, rej) => {
    try {
      const daoData = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}`);

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
export const fetchTokenPrice = async (chainName: ChainName, daoId: DaoId) => {
  const daoToken = TokenContract[daoId];

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
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<TotalSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/total-supply/compare?days=${days}`,
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
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<DelegatedSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/delegated-supply/compare?days=${days}`,
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
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<CirculatingSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/circulating-supply/compare?days=${days}`,
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
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<CexSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/cex-supply/compare?days=${days}`,
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
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<DexSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/dex-supply/compare?days=${days}`,
        { next: { revalidate: 3600 } },
      );
      const dexSupplyData = await response.json();
      res(dexSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface LendingSupplyPromise {
  oldLendingSupply: string;
  currentLendingSupply: string;
  changeRate: string;
}

/* Fetch Lending Supply */
export const fetchLendingSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<LendingSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/lending-supply/compare?days=${days}`,
        { next: { revalidate: 3600 } },
      );
      const dexSupplyData = await response.json();
      res(dexSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface TreasurySupplyPromise {
  oldTreasury: string;
  currentTreasury: string;
  changeRate: string;
}

/* Fetch Lending Supply */
export const fetchTreasurySupply = async ({
  daoId,
  days,
}: {
  daoId: DaoId;
  days: string;
}) => {
  return new Promise<TreasurySupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/treasury/compare?days=${days}`,
        { next: { revalidate: 3600 } },
      );
      const dexSupplyData = await response.json();
      res(dexSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

interface ActiveSupplyPromise {
  oldActiveSupply180d: string;
  currentActiveSupply180d: string;
  changeRate: string;
}

/* Fetch Lending Supply */
export const fetchActiveSupply = async ({ daoId, days }: { daoId: DaoId; days: string; }) => {
  return new Promise<ActiveSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/dao/${daoId}/active-supply/compare?days=${days}`,
        { next: { revalidate: 3600 } },
      );
      const dexSupplyData = await response.json();
      res(dexSupplyData);
    } catch (e) {
      rej(e);
    }
  });
};

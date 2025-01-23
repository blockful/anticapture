import { DaoIdEnum, TokenContract } from "@/lib/types/daos";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { MetricTypesEnum } from "../client/constants";
import { Address } from "viem";

export interface DAOVotingPower {
  dao: string;
  totalDelegatedVotingPower: number;
}

export const fetchDaoData = async (daoId: DaoIdEnum) => {
  return new Promise(async (res, rej) => {
    try {
      const daoData = await fetch(`${BACKEND_ENDPOINT}/dao/${daoId}`);

      res(daoData);
    } catch (e) {
      rej(e);
    }
  });
};

export enum ChainNameEnum {
  Ethereum = "ethereum",
}

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
  count: number
}

export const fetchTimeSeriesDataFromGraphQL = async (
  metricType: MetricTypesEnum,
  days: number,
): Promise<DaoMetricsDayBucket[]> => {
  const response = await fetch(`${BACKEND_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
            query DaoMetricsDayBuckets {
              daoMetricsDayBucketss(
              where: {
              metricType: ${metricType},
              date_gte: "${String(BigInt(Date.now() - days * 86400000)).slice(0, 10)}"
              },
              orderBy: "date",
              orderDirection: "asc"
              ) {
              totalCount
              items {
                date
                daoId
                tokenId
                metricType
                open
                close
                low
                high
                average
                volume
                count
              }
              }
            }
          `,
    }),
  });
  const data = await response.json();
  if (data?.data?.daoMetricsDayBucketss?.items) {
    return data.data.daoMetricsDayBucketss.items as DaoMetricsDayBucket[];
  } else {
    //TODO: Improve this error treatment
    throw new Error("invalid return type for Dao Metrics Day Bucket call")
  }
};

/* Fetch Dao Token price from Defi Llama API */
export const fetchTokenPrice = async (chainName: ChainNameEnum, daoId: DaoIdEnum) => {
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
  daoId: DaoIdEnum;
  days: string;
}) => {
  return new Promise<TotalSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoId}/total-supply/compare?days=${days}`,
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
  daoId: DaoIdEnum;
  days: string;
}) => {
  return new Promise<DelegatedSupplyPromise>(async (res, rej) => {
    try {
      const response = await fetch(
        `${BACKEND_ENDPOINT}/dao/${daoId}/delegated-supply/compare?days=${days}`,
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
  daoId: DaoIdEnum;
  days: string;
}): Promise<CirculatingSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/circulating-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
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
  daoId: DaoIdEnum;
  days: string;
}): Promise<CexSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/cex-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
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
  daoId: DaoIdEnum;
  days: string;
}): Promise<DexSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/dex-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

// TODO: Should have Promise in the name of the object, use "Response" Instead
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
  daoId: DaoIdEnum;
  days: string;
}): Promise<LendingSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/lending-supply/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

// TODO: Should have Promise in the name of the object, use "Response" Instead
interface TreasuryPromise {
  oldTreasury: string;
  currentTreasury: string;
  changeRate: string;
}

/* Fetch Treasury Supply */
export const fetchTreasury = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<TreasuryPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/treasury/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

// TODO: Should have Promise in the name of the object, use "Response" Instead
interface ActiveSupplyPromise {
  oldActiveSupply: string;
  currentActiveSupply: string;
  changeRate: string;
}

/* Fetch Active Supply */
export const fetchActiveSupply = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<ActiveSupplyPromise> => {
  try {
    const response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/active-supply?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

interface ProposalsResponse {
  currentProposalsLaunched: string;
  oldProposalsLaunched: string;
  changeRate: string;
}

/* Fetch Proposals */
export const fetchProposals = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<ProposalsResponse> => {
  try {
    const response: Response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/proposals/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

interface VotesResponse {
  currentVotes: string;
  oldVotes: string;
  changeRate: string;
}

/* Fetch Proposals */
export const fetchVotes = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<VotesResponse> => {
  try {
    const response: Response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/votes/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

interface AverageTurnoutResponse {
  currentAverageTurnout: string;
  oldAverageTurnout: string;
  changeRate: string;
}

/* Fetch Proposals */
export const fetchAverageTurnout = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<AverageTurnoutResponse> => {
  try {
    const response: Response = await fetch(
      `${BACKEND_ENDPOINT}/dao/${daoId}/average-turnout/compare?days=${days}`,
      { next: { revalidate: 3600 } },
    );
    return response.json();
  } catch (e) {
    throw e;
  }
};

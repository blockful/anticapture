import { DaoIdEnum } from "@/lib/types/daos";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { MetricTypesEnum } from "../client/constants";
import { Address } from "viem";

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
  count: number;
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
  activeSupply: string;
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

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

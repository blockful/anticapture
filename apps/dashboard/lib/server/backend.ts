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

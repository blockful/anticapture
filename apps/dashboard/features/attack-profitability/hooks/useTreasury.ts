import useSWR from "swr";
import axios from "axios";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";

export type TreasuryType = "liquid" | "dao-token" | "total";

export interface TreasuryDataPoint {
  value: number;
  date: number;
}

export interface TreasuryResponse {
  items: TreasuryDataPoint[];
  totalCount: number;
}

const QUERY_NAME_MAP: Record<TreasuryType, string> = {
  liquid: "getLiquidTreasury",
  "dao-token": "getDaoTokenTreasury",
  total: "getTotalTreasury",
};

const fetchTreasury = async ({
  daoId,
  type = "total",
  days = TimeInterval.ONE_YEAR,
  order = "asc",
}: {
  daoId: DaoIdEnum;
  type?: TreasuryType;
  days?: TimeInterval;
  order?: "asc" | "desc";
}): Promise<TreasuryResponse> => {
  const queryName = QUERY_NAME_MAP[type];
  const daysParam = `_${days}`;

  const query = `query GetTreasury {
    ${queryName}(days: ${daysParam}, order: ${order}) {
      items {
        date
        value
      }
      totalCount
    }
  }`;

  const response: {
    data: { data: { [key: string]: TreasuryResponse } };
  } = await axios.post(
    `${BACKEND_ENDPOINT}`,
    { query },
    { headers: { "anticapture-dao-id": daoId } },
  );

  return response.data.data[queryName];
};

export const useTreasury = (
  daoId: DaoIdEnum,
  type: TreasuryType = "total",
  days: TimeInterval = TimeInterval.ONE_YEAR,
  order: "asc" | "desc" = "asc",
) => {
  const { data, error, isValidating } = useSWR<TreasuryResponse>(
    ["treasury", daoId, type, days, order],
    () => fetchTreasury({ daoId, type, days, order }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  return {
    data: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    loading: isValidating,
    error,
  };
};

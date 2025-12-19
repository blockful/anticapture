import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";
import { DaoIdEnum } from "@/shared/types/daos";
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

const fetchTreasury = async ({
  daoId,
  type = "total",
  days = 365,
  order = "asc",
}: {
  daoId: DaoIdEnum;
  type?: TreasuryType;
  days?: number;
  order?: "asc" | "desc";
}): Promise<TreasuryResponse> => {
  const url = `${BACKEND_ENDPOINT}/treasury/${type}`;
  const headers = { "anticapture-dao-id": daoId };

  const response = await axios.get(url, {
    params: { days: `${days}d`, order },
    headers,
  });

  return response.data;
};

export const useTreasury = (
  daoId: DaoIdEnum,
  type: TreasuryType = "total",
  days: number = 365,
  options?: {
    order?: "asc" | "desc";
    config?: Partial<SWRConfiguration<TreasuryResponse, Error>>;
  },
) => {
  const { order = "asc", config } = options || {};
  const key = daoId ? ["treasury", daoId, type, days, order] : null;

  const { data, error, isValidating, mutate } = useSWR<TreasuryResponse>(
    key,
    () => fetchTreasury({ daoId, type, days, order }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      ...config,
    },
  );

  return {
    data: data?.items ?? [],
    totalCount: data?.totalCount ?? 0,
    loading: isValidating,
    error,
    refetch: mutate,
  };
};

import daoConfigByDaoId from "@/shared/dao-config";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { normalizeTimestamp } from "@/shared/utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

export interface TreasuryAssetData {
  date: number;
  liquidTreasury: number;
}

export const fetchTreasuryAssetData = async ({
  daoId,
  days,
  order = "asc",
}: {
  daoId: DaoIdEnum;
  days: string;
  order?: "asc" | "desc";
}): Promise<TreasuryAssetData[]> => {
  const query = `
  query {
    totalAssets(days: _${days}, order: ${order}) {
      date
      liquidTreasury
    }
  }`;

  const response = await axios.post(
    `${BACKEND_ENDPOINT}`,
    {
      query,
    },
    {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  );
  const { totalAssets } = response.data.data as {
    totalAssets: TreasuryAssetData[];
  };
  return totalAssets.map((item) => ({
    ...item,
    date: normalizeTimestamp(item.date) * 1000, // normalize to midnight, return in ms
  }));
};

export const useTreasuryAssetData = (
  daoId: DaoIdEnum,
  days: string,
  options?: {
    order?: "asc" | "desc";
    config?: Partial<SWRConfiguration<TreasuryAssetData[], Error>>;
  },
) => {
  const { order, config } = options || {};
  const key = daoId && days ? [`treasury-assets`, daoId, days, order] : null;

  const supportsLiquidTreasuryCall =
    daoConfigByDaoId[daoId].attackProfitability?.supportsLiquidTreasuryCall;
  const fixedTreasuryValue =
    daoConfigByDaoId[daoId].attackProfitability?.liquidTreasury;

  // Only create a valid key if the DAO supports liquid treasury calls
  const fetchKey = supportsLiquidTreasuryCall ? key : null;

  const { data, error, isValidating, mutate } = useSWR<TreasuryAssetData[]>(
    fetchKey,
    () => fetchTreasuryAssetData({ daoId, days, order }),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      ...config,
    },
  );

  // Return default data (empty array) when liquid treasury is not supported
  const finalData = supportsLiquidTreasuryCall
    ? data
    : fixedTreasuryValue
      ? [fixedTreasuryValue]
      : [];

  return {
    data: finalData,
    loading: isValidating,
    error,
    refetch: mutate,
  };
};

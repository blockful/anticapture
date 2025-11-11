import daoConfigByDaoId from "@/shared/dao-config";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

export interface TreasuryAssetData {
  date: number;
  totalTreasury: string;
  treasuryWithoutDaoToken: string;
}

export const fetchTreasuryAssetData = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<TreasuryAssetData[]> => {
  const query = `
  query getTotalAssets {
  totalAssets(days:_${days}){
    date
    totalTreasury
    treasuryWithoutDaoToken
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
  return totalAssets;
};

export const useTreasuryAssetData = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<TreasuryAssetData[], Error>>,
) => {
  const key = daoId && days ? [`treasury-assets`, daoId, days] : null;

  const supportsLiquidTreasuryCall =
    daoConfigByDaoId[daoId].attackProfitability?.supportsLiquidTreasuryCall;
  const fixedTreasuryValue =
    daoConfigByDaoId[daoId].attackProfitability?.liquidTreasury;

  // Only create a valid key if the DAO supports liquid treasury calls
  const fetchKey = supportsLiquidTreasuryCall ? key : null;

  const { data, error, isValidating, mutate } = useSWR<TreasuryAssetData[]>(
    fetchKey,
    () => fetchTreasuryAssetData({ daoId, days }),
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

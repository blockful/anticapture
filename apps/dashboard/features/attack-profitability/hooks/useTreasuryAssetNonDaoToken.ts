import daoConfigByDaoId from "@/shared/dao-config";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";
export interface TreasuryAssetNonDaoToken {
  date: string;
  totalAssets: string;
}

export const fetchTreasuryAssetNonDaoToken = async ({
  daoId,
  days,
}: {
  daoId: DaoIdEnum;
  days: string;
}): Promise<TreasuryAssetNonDaoToken[]> => {
  const query = `
  query getTotalAssets {
  totalAssets(days:_${days}){
    totalAssets
    date
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
    totalAssets: TreasuryAssetNonDaoToken[];
  };
  return totalAssets;
};

export const useTreasuryAssetNonDaoToken = (
  daoId: DaoIdEnum,
  days: string,
  config?: Partial<SWRConfiguration<TreasuryAssetNonDaoToken[], Error>>,
) => {
  const key = daoId && days ? [`treasury-assets`, daoId, days] : null;

  const supportsLiquidTreasuryCall =
    daoConfigByDaoId[daoId].attackProfitability?.supportsLiquidTreasuryCall;

  // Only create a valid key if the DAO supports liquid treasury calls
  const fetchKey = supportsLiquidTreasuryCall ? key : null;

  const { data, error, isValidating, mutate } = useSWR<
    TreasuryAssetNonDaoToken[]
  >(fetchKey, () => fetchTreasuryAssetNonDaoToken({ daoId, days }), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    ...config,
  });

  // Return default data (empty array) when liquid treasury is not supported
  const finalData = supportsLiquidTreasuryCall ? data : [];

  return {
    data: finalData,
    loading: isValidating,
    error,
    refetch: mutate,
  };
};

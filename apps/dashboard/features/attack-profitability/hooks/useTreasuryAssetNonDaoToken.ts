import daoConfigByDaoId from "@/shared/dao-config";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import useSWR, { SWRConfiguration } from "swr";

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
  const response = await fetch(
    `${BACKEND_ENDPOINT}/dao/${daoId}/total-assets?days=${days}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Treasury Non Dao Token data: ${response.statusText}`,
    );
  }

  return response.json();
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

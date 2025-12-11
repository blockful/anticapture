import daoConfigByDaoId from "@/shared/dao-config";
import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

export interface LatestTreasuryAsset {
  date: number;
  liquidTreasury: number;
}

export const fetchLatestTreasuryAsset = async ({
  daoId,
}: {
  daoId: DaoIdEnum;
}): Promise<LatestTreasuryAsset | null> => {
  const query = `
  query {
    latestTotalAssets {
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
  const { latestTotalAssets } = response.data.data as {
    latestTotalAssets: LatestTreasuryAsset | null;
  };
  return latestTotalAssets;
};

export const useLatestTreasuryAsset = (
  daoId: DaoIdEnum,
  config?: Partial<SWRConfiguration<LatestTreasuryAsset | null, Error>>,
) => {
  const key = daoId ? [`latest-treasury-asset`, daoId] : null;

  const supportsLiquidTreasuryCall =
    daoConfigByDaoId[daoId].attackProfitability?.supportsLiquidTreasuryCall;
  const fixedTreasuryValue =
    daoConfigByDaoId[daoId].attackProfitability?.liquidTreasury;

  const fetchKey = supportsLiquidTreasuryCall ? key : null;

  const { data, error, isValidating, mutate } =
    useSWR<LatestTreasuryAsset | null>(
      fetchKey,
      () => fetchLatestTreasuryAsset({ daoId }),
      {
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        ...config,
      },
    );

  // Return default data (null) when liquid treasury is not supported
  const finalData = supportsLiquidTreasuryCall ? data : fixedTreasuryValue;

  return {
    data: finalData,
    loading: isValidating,
    error,
    refetch: mutate,
  };
};

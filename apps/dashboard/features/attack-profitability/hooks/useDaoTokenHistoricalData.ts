import {
  type HistoricalTokenDataQuery,
  useHistoricalTokenDataQuery,
} from "@anticapture/graphql-client/hooks";

import { getOnlyClosedData } from "@/features/attack-profitability/utils/normalizeDataset";
import type { PriceEntry } from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

type HistoricalTokenDataItem = NonNullable<
  NonNullable<HistoricalTokenDataQuery["historicalTokenData"]>[number]
>;

const toPriceEntry = (item: HistoricalTokenDataItem): PriceEntry => ({
  price: item.price,
  timestamp: item.timestamp,
});

export const useDaoTokenHistoricalData = ({
  daoId,
  limit,
  closedDataOnly = true,
}: {
  daoId: DaoIdEnum;
  limit?: number;
  closedDataOnly?: boolean;
}) => {
  const { data, loading, error, refetch } = useHistoricalTokenDataQuery({
    context: {
      headers: {
        "anticapture-dao-id": daoId,
        ...getAuthHeaders(),
      },
    },
    variables: { limit: limit ?? null, skip: null },
    fetchPolicy: "network-only",
  });

  const items =
    data?.historicalTokenData
      ?.filter((item): item is HistoricalTokenDataItem => item !== null)
      .map(toPriceEntry) ?? [];

  const result = closedDataOnly ? getOnlyClosedData(items) : items;

  return {
    data: result,
    loading,
    error,
    refetch,
  };
};

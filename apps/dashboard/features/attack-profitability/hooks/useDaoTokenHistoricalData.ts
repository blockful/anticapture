import { useHistoricalTokenData } from "@anticapture/client/hooks";
import type {
  HistoricalTokenDataPathParamsDaoEnumKey,
  TokenHistoricalPriceItem,
} from "@anticapture/client";

import { getOnlyClosedData } from "@/features/attack-profitability/utils/normalizeDataset";
import type { PriceEntry } from "@/shared/dao-config/types";
import type { DaoIdEnum } from "@/shared/types/daos";

const toPriceEntry = (item: TokenHistoricalPriceItem): PriceEntry => ({
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
  const dao = daoId.toLowerCase() as HistoricalTokenDataPathParamsDaoEnumKey;

  const { data, isLoading, error, refetch } = useHistoricalTokenData(dao, {
    limit,
  });

  const items = (data ?? []).map(toPriceEntry);
  const result = closedDataOnly ? getOnlyClosedData(items) : items;

  return {
    data: result,
    loading: isLoading,
    error,
    refetch,
  };
};

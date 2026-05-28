import { useHistoricalTokenData } from "@anticapture/client/hooks";
import type { HistoricalTokenDataPathParamsDaoEnumKey } from "@anticapture/client";

import { getOnlyClosedData } from "@/features/attack-profitability/utils/normalizeDataset";
import type { DaoIdEnum } from "@/shared/types/daos";

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

  const { data, isLoading, error } = useHistoricalTokenData(dao, {
    limit,
  });

  const items = data || [];
  const result = closedDataOnly ? getOnlyClosedData(items) : items;

  return {
    data: result,
    loading: isLoading,
    error,
  };
};

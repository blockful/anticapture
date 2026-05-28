import type { HistoricalTokenDataPathParamsDaoEnumKey } from "@anticapture/client";
import { useHistoricalTokenData } from "@anticapture/client/hooks";

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
  const { data, isLoading, error } = useHistoricalTokenData(
    daoId.toLowerCase() as HistoricalTokenDataPathParamsDaoEnumKey,
    { limit: limit ?? undefined },
  );

  const result = closedDataOnly ? getOnlyClosedData(data ?? []) : (data ?? []);

  return {
    data: result,
    loading: isLoading,
    error,
  };
};

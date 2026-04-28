import type { DaoIdEnum } from "@/shared/types/daos";
import type { AccountBalancesPathParamsDaoEnumKey } from "@anticapture/client";
import { useAccountBalances } from "@anticapture/client/hooks";

export const useTopTokenHolderNonDao = (daoId: DaoIdEnum) => {
  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
  } = useAccountBalances(
    // this works because this endpoint is supported for all DAOs
    String(daoId).toLowerCase() as AccountBalancesPathParamsDaoEnumKey,
    {
      excludeDaoAddresses: true,
      limit: 1,
      orderBy: "balance",
      orderDirection: "desc",
    },
  );

  return {
    data: listData?.items[0],
    loading: isListLoading,
    error: listError ?? undefined,
  };
};

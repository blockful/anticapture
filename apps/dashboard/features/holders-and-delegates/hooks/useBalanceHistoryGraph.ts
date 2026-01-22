import { useMemo } from "react";
import { formatUnits } from "viem";

import { useBalanceHistoryGraphQuery } from "@anticapture/graphql-client/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import daoConfig from "@/shared/dao-config";
import {
  QueryInput_HistoricalBalances_OrderBy,
  QueryInput_HistoricalBalances_OrderDirection,
} from "@anticapture/graphql-client";

export function useBalanceHistoryGraph(
  accountId: string,
  daoId: DaoIdEnum,
  fromDate?: number,
) {
  const { decimals } = daoConfig[daoId];

  const { data, loading, error } = useBalanceHistoryGraphQuery({
    variables: {
      address: accountId,
      fromDate: fromDate?.toString(),
      orderBy: QueryInput_HistoricalBalances_OrderBy.Timestamp,
      orderDirection: QueryInput_HistoricalBalances_OrderDirection.Desc,
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const balanceHistory = useMemo(() => {
    if (!data?.historicalBalances?.items) return [];

    return data.historicalBalances.items
      .filter((item) => !!item)
      .map((item) => ({
        ...item,
        timestamp: Number(item.timestamp) * 1000,
        balance: Number(formatUnits(BigInt(item.balance), decimals)),
        direction: item.transfer.from === accountId ? "out" : "in",
        from: item.transfer.from,
        to: item.transfer.to,
        amount: Number(formatUnits(BigInt(item.transfer.value), decimals)),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data, accountId, decimals]);

  return {
    balanceHistory,
    loading,
    error,
  };
}

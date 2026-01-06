import { formatUnits } from "viem";
import { useMemo, useState, useEffect } from "react";

import {
  BalanceHistoryQueryVariables,
  Timestamp_Const,
  QueryInput_Transfers_SortOrder,
  useBalanceHistoryQuery,
  QueryInput_Transfers_Conditional,
  QueryInput_Transfers_SortBy,
} from "@anticapture/graphql-client/hooks";

import daoConfig from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";

export function useBalanceHistory({
  accountId,
  daoId,
  orderBy = Timestamp_Const.Timestamp,
  orderDirection = QueryInput_Transfers_SortOrder.Desc,
  transactionType = "all",
  customFromFilter,
  customToFilter,
  filterVariables,
  itemsPerPage = 10,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  customFromFilter: string | null;
  customToFilter: string | null;
  orderBy?: "timestamp" | "amount";
  orderDirection?: "asc" | "desc";
  transactionType?: "all" | "buy" | "sell";
  filterVariables?: AmountFilterVariables;
  itemsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    transactionType,
    orderBy,
    orderDirection,
    customFromFilter,
    customToFilter,
  ]);

  const queryWhere = useMemo(() => {
    const where: BalanceHistoryQueryVariables = {
      sortBy: orderBy as QueryInput_Transfers_SortBy,
      sortOrder: orderDirection as QueryInput_Transfers_SortOrder,
      fromValue: filterVariables?.minDelta,
      toValue: filterVariables?.maxDelta,
    };

    switch (transactionType) {
      case "all":
        where.conditional = QueryInput_Transfers_Conditional.Or;
        where.from = accountId;
        where.to = accountId;
        break;

      case "buy":
        where.to = accountId;
        break;

      case "sell":
        where.from = accountId;
        break;
    }

    // if (customFromFilter) {
    //   and.push(
    //     customFromFilter === accountId
    //       ? { fromAccountId: accountId }
    //       : { fromAccountId: customFromFilter, toAccountId: accountId },
    //   );
    // }

    // if (customToFilter) {
    //   and.push(
    //     customToFilter === accountId
    //       ? { toAccountId: accountId }
    //       : { fromAccountId: accountId, toAccountId: customToFilter },
    //   );
    // }

    return where;
  }, [
    accountId,
    transactionType,
    // customFromFilter,
    // customToFilter,
    filterVariables,
    orderBy,
    orderDirection,
  ]);

  const queryVariables = useMemo(
    () => ({
      limit: itemsPerPage,
      orderBy,
      orderDirection,
      where: queryWhere,
    }),
    [itemsPerPage, orderBy, orderDirection, queryWhere],
  );

  const { data, error, loading } = useBalanceHistoryQuery({
    variables: queryVariables,
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
    skip: !accountId,
    fetchPolicy: "cache-and-network",
  });

  // Transform raw transfers to our format
  const transformedTransfers = useMemo(() => {
    if (!data?.transfers?.items) return [];

    return data.transfers.items
      .filter((t) => !!t)
      .map((transfer) => ({
        timestamp: transfer.timestamp.toString(),
        amount:
          token === "ERC20"
            ? formatUnits(BigInt(transfer.amount || "0"), 18)
            : (transfer.amount || "0").toString(),
        fromAccountId: transfer.fromAccountId,
        toAccountId: transfer.toAccountId,
        transactionHash: transfer.transactionHash,
        direction: (transfer.fromAccountId === accountId ? "out" : "in") as
          | "in"
          | "out",
      }));
  }, [data, accountId, token]);

  return {
    transfers: transformedTransfers,
    loading,
    error,
    fetchNextPage: () =>
      currentPage * itemsPerPage < (data?.transfers?.totalCount || 0) &&
      setCurrentPage((prev) => prev + 1),
    fetchPreviousPage: () =>
      currentPage > 1 && setCurrentPage((prev) => prev - 1),
    hasNextPage:
      currentPage * itemsPerPage < (data?.transfers?.totalCount || 0),
    hasPreviousPage: currentPage > 1,
  };
}

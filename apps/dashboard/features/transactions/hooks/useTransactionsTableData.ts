"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  QueryInput_Transactions_SortOrder,
  useTransactionsQuery,
} from "@anticapture/graphql-client/hooks";
import {
  adaptTransactionsToTableData,
  GraphTransaction,
} from "@/features/transactions/utils/transactionsAdapter";
import { NetworkStatus } from "@apollo/client";
import { formatUnits } from "viem";
import { SupplyType } from "@/shared/components";
import daoConfig from "@/shared/dao-config";

export type AffectedSupplyType = "CEX" | "DEX" | "LENDING" | "TOTAL";

export interface TransactionsFilters {
  toDate?: number;
  fromDate?: number;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  affectedSupply?: AffectedSupplyType[];
  sortOrder: "asc" | "desc";
}

export interface TransactionData {
  id: string;
  amount: string;
  date: string;
  from: string;
  to: string;
  affectedSupply?: SupplyType[];
  isAutoUpdated?: boolean;
  direction?: "up" | "down";
  subRows?: TransactionData[];
  txHash?: string;
}

interface PaginationInfo {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  itemsPerPage: number;
}

export const useTransactionsTableData = ({
  daoId,
  limit = 15,
  filters,
}: UseTransactionsTableDataParams) => {
  const { decimals } = daoConfig[daoId];
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    Math.floor(offset / limit) + 1,
  );

  const { data, loading, error, refetch, fetchMore, networkStatus } = useTransactionsQuery({
    variables: {
      limit,
      offset: (currentPage - 1) * limit,
      ...(filters?.from && { from: filters?.from }),
      ...(filters?.to && { to: filters?.to }),
      ...(filters?.minAmount && {
        minAmount: formatUnits(BigInt(filters.minAmount), decimals),
      }),
      ...(filters?.maxAmount && {
        maxAmount: formatUnits(BigInt(filters.maxAmount), decimals),
      }),
      ...(filters?.sortOrder && {
        sortOrder: filters?.sortOrder as QueryInput_Transactions_SortOrder,
      }),
      ...(filters?.affectedSupply && {
          affectedSupply: filters?.affectedSupply,
        }),
      ...(filters?.fromDate && { fromDate: filters?.fromDate }),
      ...(filters?.toDate && { toDate: filters?.toDate }),
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
      context: { headers: { "anticapture-dao-id": daoId } },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
    });

  // reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters?.from,
    filters?.to,
    filters?.minAmount,
    filters?.maxAmount,
    filters?.sortOrder,
    filters?.affectedSupply,
  ]);

  const transactions = useMemo(() => data?.transactions?.items ?? [], [data]);
  const totalCount = data?.transactions?.totalCount ?? 0;

  const pagination: PaginationInfo = useMemo(() => {
    const hasNextPage = totalCount > currentPage * limit;
    return {
      totalCount,
      hasNextPage,
      hasPreviousPage: currentPage > 1,
      currentPage,
      itemsPerPage: limit,
    };
  }, [totalCount, currentPage, limit]);

  const fetchNextPage = useCallback(async () => {
    if (!pagination.hasNextPage || isPaginationLoading) return;

    setIsPaginationLoading(true);
    try {
      await fetchMore({
        variables: {
          offset: currentPage * limit,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.transactions?.items?.length) return prev;

          return {
            ...fetchMoreResult,
            transactions: {
              ...fetchMoreResult.transactions,
              items: [
                ...(prev.transactions?.items ?? []),
                ...fetchMoreResult.transactions.items,
              ],
            },
          };
        },
      });
      setCurrentPage((p) => p + 1);
    } catch (err) {
      console.error("Error fetching next page:", err);
    } finally {
      setIsPaginationLoading(false);
    }
  }, [fetchMore, pagination, isPaginationLoading, currentPage, limit]);

  const handleRefetch = useCallback(() => {
    setCurrentPage(1);
    refetch();
  }, [refetch]);

  const isInitialLoading = useMemo(
    () =>
      (networkStatus === NetworkStatus.loading && !transactions.length) ||
      networkStatus === NetworkStatus.setVariables ||
      networkStatus === NetworkStatus.refetch,
    [networkStatus, transactions],
  );

  return {
    data: adaptTransactionsToTableData(
      (data?.transactions?.items as GraphTransaction[]) ?? [],
      decimals,
    ),
    loading: isInitialLoading,
    error,
    refetch: handleRefetch,
    pagination,
    fetchNextPage,
    fetchingMore:
      isPaginationLoading || networkStatus === NetworkStatus.fetchMore,
  };
};

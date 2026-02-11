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
import { parseUnits } from "viem";
import { SupplyType } from "@/shared/components";
import daoConfig from "@/shared/dao-config";
import { TransactionsParamsType } from "@/features/transactions/hooks/useTransactionParams";

export type AffectedSupplyType =
  | "CEX"
  | "DEX"
  | "LENDING"
  | "TOTAL"
  | "UNASSIGNED";

export interface TransactionsFilters extends TransactionsParamsType {
  toDate?: number;
  fromDate?: number;
  affectedSupply?: AffectedSupplyType[];
  includes?: string[];
}

export interface TransactionData {
  id: string;
  amount: string;
  timestamp: string;
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
  limit: number;
}

interface UseTransactionsTableDataParams {
  daoId: DaoIdEnum;
  limit?: number;
  offset?: number;
  filters?: TransactionsFilters;
}

export const useTransactionsTableData = ({
  daoId,
  limit = 10,
  filters,
}: UseTransactionsTableDataParams) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);

  const { decimals } = daoConfig[daoId];
  const { data, error, refetch, fetchMore, networkStatus } =
    useTransactionsQuery({
      variables: {
        limit,
        offset: 0,
        ...(filters?.from && { from: filters?.from }),
        ...(filters?.to && { to: filters?.to }),
        ...(filters?.min && {
          minAmount: parseUnits(filters.min.toString(), decimals).toString(),
        }),
        ...(filters?.max && {
          maxAmount: parseUnits(filters.max.toString(), decimals).toString(),
        }),
        ...(filters?.sort && {
          sortOrder: filters?.sort as QueryInput_Transactions_SortOrder,
        }),
        ...(filters?.affectedSupply && {
          affectedSupply: filters?.affectedSupply,
        }),
        ...(filters?.fromDate && { fromDate: filters?.fromDate }),
        ...(filters?.toDate && { toDate: filters?.toDate }),
        ...(filters?.includes && { includes: filters?.includes }),
      },
      context: {
        headers: {
          "anticapture-dao-id": daoId,
        },
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
    });

  // reset page when filters change
  const filtersHash = useMemo(
    () =>
      JSON.stringify({
        from: filters?.from,
        to: filters?.to,
        minAmount: filters?.min,
        maxAmount: filters?.max,
        sortOrder: filters?.sort,
        affectedSupply: filters?.affectedSupply,
        includes: filters?.includes,
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
      }),
    [filters],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filtersHash]);

  const transactions = useMemo(() => data?.transactions?.items ?? [], [data]);
  const totalCount = data?.transactions?.totalCount ?? 0;

  const pagination: PaginationInfo = useMemo(() => {
    const hasNextPage = totalCount > currentPage * limit;
    return {
      totalCount,
      hasNextPage,
      hasPreviousPage: currentPage > 1,
      currentPage,
      limit,
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

          const prevItems = prev.transactions?.items ?? [];
          const newItems = fetchMoreResult.transactions.items ?? [];
          const merged = [...prevItems, ...newItems];

          return {
            ...fetchMoreResult,
            transactions: {
              ...fetchMoreResult.transactions,
              items: merged,
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

"use client";

import type {
  OrderDirection,
  QueryInput_Transactions_AffectedSupply_Items,
  QueryInput_Transactions_Includes_Items,
} from "@anticapture/graphql-client/hooks";
import { useTransactionsQuery } from "@anticapture/graphql-client/hooks";
import { NetworkStatus } from "@apollo/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";

import type { TransactionsParamsType } from "@/features/transactions/hooks/useTransactionParams";
import type { GraphTransaction } from "@/features/transactions/utils/transactionsAdapter";
import { adaptTransactionsToTableData } from "@/features/transactions/utils/transactionsAdapter";
import type { SupplyType } from "@/shared/components";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { getAuthHeaders } from "@/shared/utils/server-utils";

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
        skip: 0,
        from: filters?.from ?? null,
        to: filters?.to ?? null,
        minAmount: filters?.min
          ? parseUnits(filters.min.toString(), decimals).toString()
          : null,
        maxAmount: filters?.max
          ? parseUnits(filters.max.toString(), decimals).toString()
          : null,
        orderDirection: (filters?.sort as OrderDirection) ?? null,
        affectedSupply: filters?.affectedSupply
          ? (filters.affectedSupply as QueryInput_Transactions_AffectedSupply_Items[])
          : null,
        fromDate: filters?.fromDate ?? null,
        toDate: filters?.toDate ?? null,
        includes: filters?.includes
          ? (filters.includes as QueryInput_Transactions_Includes_Items[])
          : null,
      },
      context: {
        headers: {
          "anticapture-dao-id": daoId,
          ...getAuthHeaders(),
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

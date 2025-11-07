"use client";

import { useCallback, useEffect, useState } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  QueryInput_Transactions_SortOrder,
  useTransactionsQuery,
} from "@anticapture/graphql-client/hooks";
import {
  adaptTransactionsToTableData,
  GraphTransaction,
} from "@/features/transactions/utils/transactionsAdapter";
import { formatUnits } from "viem";
import { SupplyType } from "@/shared/components";
import daoConfig from "@/shared/dao-config";

export interface TransactionsFilters {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  sortOrder: "asc" | "desc";
}

export interface TransactionData {
  id: string;
  affectedSupply: SupplyType[];
  amount: string;
  date: string;
  from: string;
  to: string;
  isAutoUpdated?: boolean;
  direction?: "up" | "down";
  subRows?: TransactionData[];
  txHash?: string;
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
  offset = 0,
  filters,
}: UseTransactionsTableDataParams) => {
  const { decimals } = daoConfig[daoId];
  const [currentPage, setCurrentPage] = useState(
    Math.floor(offset / limit) + 1,
  );

  const { data, loading, error, refetch } = useTransactionsQuery({
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
    },
    context: {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters?.from,
    filters?.to,
    filters?.minAmount,
    filters?.maxAmount,
    filters?.sortOrder,
  ]);

  const fetchNextPage = useCallback(() => {
    if (currentPage) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage]);

  const fetchPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  return {
    data: adaptTransactionsToTableData(
      (data?.transactions?.items as GraphTransaction[]) ?? [],
      decimals,
    ),
    loading,
    error,
    refetch,
    pagination: {
      currentPage,
      hasPreviousPage: currentPage !== 0,
      itemsPerPage: limit,
    },
    fetchNextPage,
    fetchPreviousPage,
  };
};

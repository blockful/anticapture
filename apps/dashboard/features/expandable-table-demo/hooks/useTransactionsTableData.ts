"use client";

import { useCallback, useState } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  QueryInput_Transactions_SortOrder,
  useTransactionsQuery,
} from "@anticapture/graphql-client/hooks";
import {
  adaptTransactionsToTableData,
  GraphTransaction,
} from "@/features/expandable-table-demo/utils/transactionsAdapter";
import { parseEther } from "viem";
import { SupplyType } from "@/shared/components";

export interface TransactionsFilters {
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  sortOrder?: "asc" | "desc";
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
  daoId?: DaoIdEnum;
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
  const [currentPage, setCurrentPage] = useState(
    Math.floor(offset / limit) + 1,
  );

  const { data, loading, error, refetch } = useTransactionsQuery({
    variables: {
      limit,
      offset: (currentPage - 1) * limit,
      from: filters?.from,
      to: filters?.to,
      minAmount: parseEther(String(filters?.minAmount ?? 0)).toString(),
      maxAmount: parseEther(String(filters?.maxAmount ?? 0)).toString(),
      sortOrder: filters?.sortOrder as QueryInput_Transactions_SortOrder,
    },
    context: daoId
      ? {
          headers: {
            "anticapture-dao-id": daoId,
          },
        }
      : undefined,
  });

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
      (data?.transactions?.transactions as GraphTransaction[]) ?? [],
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

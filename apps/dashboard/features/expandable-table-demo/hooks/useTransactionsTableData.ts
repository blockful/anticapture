"use client";

import { useMemo } from "react";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  adaptTransactionsToTableData,
  GraphTransaction,
} from "@/features/expandable-table-demo/utils/transactionsAdapter";
import { TransactionData } from "@/shared/constants/mocked-data/sample-expandable-data";
import { useTransactionsQuery } from "@anticapture/graphql-client/hooks";

interface UseTransactionsTableDataParams {
  daoId?: DaoIdEnum;
  limit?: number;
  offset?: number;
}

export const useTransactionsTableData = ({
  daoId,
  limit = 10,
  offset = 0,
}: UseTransactionsTableDataParams) => {
  const { data, loading, error, refetch } = useTransactionsQuery({
    variables: { limit, offset },
    context: daoId
      ? {
          headers: {
            "anticapture-dao-id": daoId,
          },
        }
      : undefined,
    fetchPolicy: "cache-and-network",
  });

  const adaptedData: TransactionData[] = useMemo(() => {
    const txs = data?.transactions?.transactions ?? [];
    return adaptTransactionsToTableData(txs as GraphTransaction[]);
  }, [data]);

  return {
    data: adaptedData,
    total: data?.transactions?.total ?? 0,
    loading,
    error,
    refetch,
  };
};

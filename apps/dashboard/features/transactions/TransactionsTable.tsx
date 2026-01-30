"use client";

import { useMemo } from "react";
import { SupplyType } from "@/shared/components/badges/SupplyLabel";
import { useTransactionsTableData } from "@/features/transactions";
import { DaoIdEnum } from "@/shared/types/daos";
import { useParams } from "next/navigation";
import { AffectedSupplyType } from "@/features/transactions/hooks/useTransactionsTableData";
import { Table } from "@/shared/components/design-system/table/Table";
import { getTransactionsColumns } from "@/features/transactions/utils/getTransactionsColumns";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import { useTransactionsTableParams } from "@/features/transactions/hooks/useTransactionParams";

type Supply = "CEX" | "DEX" | "LENDING" | "TOTAL" | "UNASSIGNED";

export const AcceptedMetrics: Supply[] = ["CEX", "DEX", "LENDING", "TOTAL"];

export const TransactionsTable = ({
  metrics,
  hasTransfer,
  startDate,
  endDate,
}: {
  metrics: string[];
  hasTransfer: boolean;
  startDate: number;
  endDate: number;
}) => {
  const pageLimit: number = 20;
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();
  const filterParams = useTransactionsTableParams();

  const affectedSupply = useMemo(
    () =>
      metrics
        .map((metric) => metric.replace("_SUPPLY", ""))
        .filter((metric) =>
          AcceptedMetrics.includes(metric as Supply),
        ) as AffectedSupplyType[],
    [metrics],
  );

  const buildFilters = (
    showAll: boolean,
    affectedSupply: Supply[],
  ): Supply[] => {
    if (showAll) {
      return affectedSupply.length ? [...affectedSupply, "UNASSIGNED"] : [];
    } else {
      return affectedSupply.length
        ? affectedSupply
        : ["CEX", "DEX", "LENDING", "TOTAL"];
    }
  };

  const includes = [
    ...(metrics.includes("DELEGATED_SUPPLY") ? ["DELEGATION"] : []),
  ];

  const {
    data: tableData,
    pagination,
    fetchNextPage,
    loading,
    fetchingMore,
  } = useTransactionsTableData({
    daoId: daoId.toUpperCase() as DaoIdEnum,
    filters: {
      ...filterParams,
      toDate: endDate + SECONDS_PER_DAY - 1, // include the entire end date
      fromDate: startDate,
      affectedSupply: buildFilters(hasTransfer, affectedSupply),
      includes,
    },
    limit: pageLimit,
  });

  const columns = getTransactionsColumns({
    loading,
    daoId: daoId.toUpperCase() as DaoIdEnum,
    filterParams,
  });

  if (loading && (!tableData || tableData.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-20rem)] min-h-[300px] w-full flex-col">
        <Table
          columns={columns}
          data={Array.from({ length: pageLimit }, () => ({
            id: "loading-row",
            affectedSupply: ["CEX", "DEX"] as SupplyType[],
            amount: "1000000",
            date: "2 hours ago",
            from: "0x1234567890abcdef",
            to: "0xabcdef1234567890",
            txHash:
              "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            subRows: [],
          }))}
          enableExpanding={true}
          getSubRows={(row) => row.subRows}
          stickyFirstColumn={true}
          withSorting={true}
          size="sm"
          mobileTableFixed={true}
          withDownloadCSV={true}
          wrapperClassName="h-full overflow-y-auto"
        />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-20rem)] min-h-[300px] w-full flex-col text-white">
      <Table
        columns={columns}
        data={tableData}
        size="sm"
        hasMore={pagination.hasNextPage}
        isLoadingMore={fetchingMore}
        onLoadMore={fetchNextPage}
        wrapperClassName="h-full overflow-y-auto"
        enableExpanding={true}
        getSubRows={(row) => row.subRows}
        withSorting={true}
        mobileTableFixed={true}
      />
    </div>
  );
};

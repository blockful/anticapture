"use client";

import { useState, useMemo } from "react";
import { SupplyType } from "@/shared/components/badges/SupplyLabel";
import { useTransactionsTableData } from "@/features/transactions";
import { DaoIdEnum } from "@/shared/types/daos";
import { useParams } from "next/navigation";
import { AffectedSupplyType } from "@/features/transactions/hooks/useTransactionsTableData";
import { Table } from "@/shared/components/design-system/table/Table";
import { getTransactionsColumns } from "@/features/transactions/utils/getTransactionsColumns";
import { SECONDS_PER_DAY } from "@/shared/constants/time-related";
import { Hourglass } from "lucide-react";

type Supply = "CEX" | "DEX" | "LENDING" | "TOTAL" | "UNASSIGNED";

export const AcceptedMetrics: Supply[] = ["CEX", "DEX", "LENDING", "TOTAL"];

const LoadingOverlay = (
  <div className="bg-surface-default/80 absolute inset-0 z-20 flex w-full flex-col items-center justify-center text-center">
    <div className="bg-surface-default relative mb-2.5 flex size-[32px] items-center justify-center rounded-full">
      <div className="border-surface-solid-brand absolute left-1/2 top-1/2 size-8 shrink-0 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-[1px]" />
      <div className="bg-surface-action flex size-6 shrink-0 items-center justify-center rounded-full">
        <Hourglass className="text-inverted size-[14px]" />
      </div>
    </div>
    <p className="text-primary mb-1 font-mono text-[13px] font-medium uppercase tracking-wider">
      Syncing Data with Chart…
    </p>
    <p className="text-secondary text-sm">
      The table reflects the metrics and timeframe you choose above. <br />
      This might take a moment.
    </p>
  </div>
);

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
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();

  const [fromFilter, setFromFilter] = useState<string>("");
  const [toFilter, setToFilter] = useState<string>("");
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      toDate: endDate + SECONDS_PER_DAY - 1, // include the entire end date
      fromDate: startDate,
      from: fromFilter || undefined,
      to: toFilter || undefined,
      minAmount,
      maxAmount,
      sortOrder,
      affectedSupply: buildFilters(hasTransfer, affectedSupply),
      includes,
    },
  });

  const columns = getTransactionsColumns({
    loading,
    daoId: daoId.toUpperCase() as DaoIdEnum,
    minAmount,
    maxAmount,
    setMinAmount,
    setMaxAmount,
    fromFilter,
    setFromFilter,
    toFilter,
    setToFilter,
    sortOrder,
    setSortOrder,
  });

  if (loading) {
    return (
      <div className="relative flex flex-col gap-2">
        <Table
          columns={columns}
          data={Array.from({ length: 10 }, () => ({
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
          withSorting={true}
          size="sm"
          mobileTableFixed={true}
          wrapperClassName="h-[450px]"
          className="h-[400px]"
          loadingOverlay={LoadingOverlay}
        />
      </div>
    );
  }

  return (
    <div className="w-full text-white">
      <div className="flex flex-col gap-2">
        <Table
          columns={columns}
          data={tableData}
          size="sm"
          hasMore={pagination.hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          wrapperClassName="h-[450px]"
          className="h-[400px]"
          enableExpanding={true}
          getSubRows={(row) => row.subRows}
          withSorting={true}
        />
      </div>
    </div>
  );
};

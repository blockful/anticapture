"use client";

import { useState } from "react";
import { SupplyType } from "@/shared/components/badges/SupplyLabel";
import { useTransactionsTableData } from "@/features/transactions";
import { DaoIdEnum } from "@/shared/types/daos";
import { useParams } from "next/navigation";
import { AffectedSupplyType } from "@/features/transactions/hooks/useTransactionsTableData";
import { Table } from "@/shared/components/design-system/table/Table";
import { getTransactionsColumns } from "@/features/transactions/utils/getTransactionsColumns";

const AcceptedMetrics: string[] = ["CEX", "DEX", "LENDING", "TOTAL"];

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

  const affectedSupply = metrics
    .map((metric) => metric.replace("_SUPPLY", ""))
    .filter((metric) =>
      AcceptedMetrics.includes(metric),
    ) as AffectedSupplyType[];

  const formattedAffectedSupply = affectedSupply
    ? affectedSupply
    : !hasTransfer
      ? (AcceptedMetrics as AffectedSupplyType[])
      : [];

  const {
    data: tableData,
    pagination,
    fetchNextPage,
    loading,
    fetchingMore,
  } = useTransactionsTableData({
    daoId: daoId.toUpperCase() as DaoIdEnum,
    filters: {
      toDate: endDate,
      fromDate: startDate,
      from: fromFilter || undefined,
      to: toFilter || undefined,
      minAmount,
      maxAmount,
      sortOrder,
      affectedSupply: formattedAffectedSupply,
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

  if (loading && (!tableData || tableData.length === 0)) {
    return (
      <div className="flex flex-col gap-2">
        <Table
          columns={columns}
          data={Array.from({ length: 7 }, () => ({
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
          wrapperClassName="h-[450px]"
          className="h-[400px]"
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
          // withDownloadCSV={true}
          wrapperClassName="h-[450px]"
          className="h-[400px]"
          enableExpanding={true}
          getSubRows={(row) => row.subRows}
          withSorting={true}
          stickyFirstColumn={true}
          mobileTableFixed={true}
        />
      </div>
    </div>
  );
};

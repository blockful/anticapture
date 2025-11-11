"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SkeletonRow, Button, IconButton } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useBalanceHistory } from "@/features/holders-and-delegates/hooks/useBalanceHistory";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import {
  FilterDropdown,
  FilterOption,
} from "@/shared/components/dropdowns/FilterDropdown";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { Table } from "@/shared/components/design-system/table/Table";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";
import { parseEther } from "viem";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import { AddressFilter } from "@/shared/components/design-system/table/filters";
import { fetchEnsData } from "@/shared/hooks/useEnsData";
import { BalanceHistoryVariationGraph } from "@/features/holders-and-delegates/components/BalanceHistoryVariationGraph";

interface BalanceHistoryData {
  id: string;
  date: string;
  amount: string;
  type: "Buy" | "Sell";
  fromAddress: string;
  fromEns?: string;
  toAddress: string;
  toEns?: string;
}

interface BalanceHistoryProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const BalanceHistory = ({ accountId, daoId }: BalanceHistoryProps) => {
  const [sortBy, setSortBy] = useState<string>("date");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("timestamp");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [filterVariables, setFilterVariables] =
    useState<AmountFilterVariables>();
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [fromFilter, setFromFilter] = useState<string>();
  const [toFilter, setToFilter] = useState<string>(accountId);
  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

  // Filter options for transaction type
  const typeFilterOptions: FilterOption[] = [
    { value: "all", label: "All Transactions" },
    { value: "Buy", label: "Buy" },
    { value: "Sell", label: "Sell" },
  ];

  // Convert UI filter to hook filter format
  const transactionType =
    typeFilter === "Buy" ? "buy" : typeFilter === "Sell" ? "sell" : "all";

  // Use the balance history hook
  const { transfers, loading, paginationInfo, fetchNextPage, fetchingMore } =
    useBalanceHistory({
      accountId,
      daoId,
      orderBy,
      orderDirection,
      transactionType,
      fromFilter,
      toFilter,
      filterVariables,
    });

  // Handle sorting - both date and amount now control the GraphQL query
  const handleSort = (field: string) => {
    if (field === "date") {
      const newOrderBy = "timestamp";
      // Toggle direction if we're already sorting by date, otherwise start with desc
      const newOrderDirection =
        sortBy === "date" &&
        orderBy === "timestamp" &&
        orderDirection === "desc"
          ? "asc"
          : "desc";
      setOrderBy(newOrderBy);
      setOrderDirection(newOrderDirection);
      setSortBy("date");
    } else if (field === "amount") {
      const newOrderBy = "amount";
      // Toggle direction if we're already sorting by amount, otherwise start with desc
      const newOrderDirection =
        sortBy === "amount" && orderBy === "amount" && orderDirection === "desc"
          ? "asc"
          : "desc";
      setOrderBy(newOrderBy);
      setOrderDirection(newOrderDirection);
      setSortBy("amount");
    }
  };

  const isInitialLoading = loading && (!transfers || transfers.length === 0);

  // Transform transfers to table data format
  const transformedData = useMemo(() => {
    return transfers.map((transfer) => {
      const transferDate = new Date(parseInt(transfer.timestamp) * 1000);
      const now = new Date();
      const diffInMs = now.getTime() - transferDate.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      const diffInWeeks = Math.floor(diffInDays / 7);
      const diffInMonths = Math.floor(diffInDays / 30);
      const diffInYears = Math.floor(diffInDays / 365);

      let relativeTime;
      if (diffInYears > 0) {
        relativeTime = `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
      } else if (diffInMonths > 0) {
        relativeTime = `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
      } else if (diffInWeeks > 0) {
        relativeTime = `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
      } else if (diffInDays > 0) {
        relativeTime = `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
      } else if (diffInHours > 0) {
        relativeTime = `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
      } else if (diffInMinutes > 0) {
        relativeTime = `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
      } else {
        relativeTime = "Just now";
      }

      return {
        id: transfer.transactionHash,
        date: relativeTime,
        amount: formatNumberUserReadable(parseFloat(transfer.amount)),
        type: transfer.direction === "in" ? "Buy" : ("Sell" as "Buy" | "Sell"),
        fromAddress: transfer.fromAccountId || "",
        toAddress: transfer.toAccountId || "",
      };
    });
  }, [transfers]);

  const balanceHistoryColumns: ColumnDef<BalanceHistoryData>[] = [
    {
      accessorKey: "date",
      meta: {
        columnClassName: "w-32",
      },
      cell: ({ row }) => {
        const date = row.getValue("date") as string;

        if (isInitialLoading) {
          return (
            <div className="flex items-center">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-20"
              />
            </div>
          );
        }

        return (
          <div className="flex items-center whitespace-nowrap">
            <span className="text-primary text-sm">{date}</span>
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start p-0"
          onClick={() => handleSort("date")}
        >
          <span className="text-xs">Date</span>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "date"
                ? orderDirection === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
    },
    {
      accessorKey: "amount",
      meta: {
        columnClassName: "w-32",
      },
      cell: ({ row }) => {
        const amount = row.getValue("amount") as string;

        if (isInitialLoading) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end">
            <span className="text-secondary text-sm font-medium">{amount}</span>
          </div>
        );
      },
      header: () => (
        <div className="text-secondary flex w-full items-center justify-end gap-1.5 text-nowrap">
          <span className="text-xs">Amount ({daoId.toUpperCase()})</span>
          <AmountFilter
            onApply={(filterState) => {
              setOrderDirection(
                filterState.sortOrder === "largest-first" ? "desc" : "asc",
              );

              setFilterVariables(() => ({
                minDelta: filterState.minAmount
                  ? parseEther(filterState.minAmount).toString()
                  : undefined,
                maxDelta: filterState.maxAmount
                  ? parseEther(filterState.maxAmount).toString()
                  : undefined,
              }));

              setIsFilterActive(
                !!(filterVariables?.minDelta || filterVariables?.maxDelta),
              );
              setSortBy("delta");
            }}
            onReset={() => {
              setIsFilterActive(false);
              // Reset to default sorting
              setSortBy("timestamp");
              setFilterVariables(() => ({
                minDelta: undefined,
                maxDelta: undefined,
              }));
            }}
            isActive={isFilterActive}
            sortOptions={sortOptions}
          />
        </div>
      ),
    },
    {
      accessorKey: "type",
      meta: {
        columnClassName: "w-20",
      },
      cell: ({ row }) => {
        const type = row.getValue("type") as "Buy" | "Sell";

        if (isInitialLoading) {
          return (
            <div className="flex items-center">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-6 w-12 rounded-full"
              />
            </div>
          );
        }

        return (
          <div className="flex items-center">
            <BadgeStatus variant={type === "Buy" ? "success" : "error"}>
              {type}
            </BadgeStatus>
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-2">
          <h4 className="text-table-header text-xs">Type</h4>
          <FilterDropdown
            options={typeFilterOptions}
            selectedValue={typeFilter}
            onValueChange={setTypeFilter}
          />
        </div>
      ),
    },
    {
      accessorKey: "fromAddress",
      meta: {
        columnClassName: "w-52",
      },
      cell: ({ row }) => {
        const fromAddress = row.getValue("fromAddress") as string;

        if (isInitialLoading) {
          return (
            <div className="flex items-center gap-3">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="size-6 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        return (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="text-primary flex max-w-[160px] items-center gap-2 overflow-hidden">
              <EnsAvatar
                address={fromAddress as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                nameClassName={cn(
                  "text-secondary truncate max-w-[120px]",
                  fromAddress === accountId && "text-primary",
                )}
              />
            </div>

            <ArrowRight className="text-secondary size-4" />
          </div>
        );
      },
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>From</span>
          <AddressFilter
            onApply={async (addr) => {
              if ((addr ?? "").indexOf(".eth") > 0) {
                const { address } = await fetchEnsData({
                  address: addr as `${string}.eth`,
                });
                setFromFilter(address || "");
                return;
              }
              setFromFilter(addr || "");
            }}
            currentFilter={fromFilter}
          />
        </div>
      ),
    },
    {
      accessorKey: "toAddress",
      meta: {
        columnClassName: "w-52",
      },
      cell: ({ row }) => {
        const toAddress = row.getValue("toAddress") as string;

        if (isInitialLoading) {
          return (
            <div className="flex items-center gap-3">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="size-6 rounded-full"
              />
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        return (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="text-primary flex max-w-[160px] items-center gap-2 overflow-hidden">
              <EnsAvatar
                address={toAddress as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                nameClassName={cn(
                  "text-secondary truncate max-w-[120px]",
                  toAddress === accountId && "text-primary",
                )}
              />
            </div>
            <a
              href={`${daoConfigByDaoId[daoId].daoOverview.chain.blockExplorers?.default.url}/tx/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton variant="ghost" icon={ExternalLink} />
            </a>
          </div>
        );
      },
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>To</span>
          <AddressFilter
            onApply={async (addr) => {
              if ((addr ?? "").indexOf(".eth") > 0) {
                const { address } = await fetchEnsData({
                  address: addr as `${string}.eth`,
                });
                setToFilter(address || "");
                return;
              }
              setToFilter(addr || "");
            }}
            currentFilter={toFilter}
          />
        </div>
      ),
    },
  ];

  if (isInitialLoading) {
    return (
      <div className="flex w-full flex-col gap-2 p-4">
        <Table
          columns={balanceHistoryColumns}
          data={Array.from({ length: 12 }, (_, i) => ({
            id: `skeleton-${i}`,
            date: "",
            amount: "",
            type: "Buy" as "Buy" | "Sell",
            fromAddress: "",
            toAddress: "",
          }))}
          withDownloadCSV={true}
          size="sm"
          wrapperClassName="h-[450px]"
          className="h-[400px]"
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-default flex flex-col">
      {/* Graph Section */}
      <div className="flex-shrink-0 p-4 pb-2">
        <BalanceHistoryVariationGraph accountId={accountId} daoId={daoId} />
      </div>

      {/* Table Section */}
      <div className="flex w-full flex-col gap-2 p-4">
        <Table
          columns={balanceHistoryColumns}
          data={transformedData}
          size="sm"
          hasMore={paginationInfo.hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          wrapperClassName="h-[450px]"
          className="h-[400px]"
          withDownloadCSV={true}
        />
      </div>
    </div>
  );
};

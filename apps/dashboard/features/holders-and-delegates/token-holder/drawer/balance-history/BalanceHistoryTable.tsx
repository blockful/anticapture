"use client";

import { useMemo } from "react";
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
import { Table } from "@/shared/components/design-system/table/Table";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { parseUnits } from "viem";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import { AddressFilter } from "@/shared/components/design-system/table/filters";
import { fetchAddressFromEnsName } from "@/shared/hooks/useEnsData";
import daoConfig from "@/shared/dao-config";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { DaoIdEnum } from "@/shared/types/daos";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { formatRelativeTime } from "@/features/holders-and-delegates/utils";

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

export const BalanceHistoryTable = ({
  accountId,
  daoId,
  fromTimestamp,
  toTimestamp,
}: {
  accountId: string;
  daoId: DaoIdEnum;
  fromTimestamp?: number;
  toTimestamp?: number;
}) => {
  const { decimals } = daoConfig[daoId];

  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum(["all", "buy", "sell"]).withDefault("all"),
  );
  const [orderBy, setOrderBy] = useQueryState(
    "orderBy",
    parseAsStringEnum(["timestamp", "amount"]).withDefault("timestamp"),
  );
  const [orderDirection, setOrderDirection] = useQueryState(
    "orderDirection",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const [filterVariables, setFilterVariables] = useQueryStates({
    fromValue: parseAsString,
    toValue: parseAsString,
  });
  const [customFromFilter, setCustomFromFilter] = useQueryState("from");
  const [customToFilter, setCustomToFilter] = useQueryState("to");
  const [isFilterActive, setIsFilterActive] = useQueryState(
    "active",
    parseAsBoolean.withDefault(false),
  );

  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

  // Filter options for transaction type
  const typeFilterOptions: FilterOption[] = [
    { value: "all", label: "All Transactions" },
    { value: "buy", label: "Buy" },
    { value: "sell", label: "Sell" },
  ];

  // Convert UI filter to hook filter format
  const transactionType = typeFilter as "all" | "buy" | "sell";

  // Use the balance history hook
  const { transfers, loading, fetchNextPage, error, hasNextPage } =
    useBalanceHistory({
      decimals,
      accountId,
      daoId,
      orderBy,
      orderDirection,
      transactionType,
      customFromFilter,
      customToFilter,
      filterVariables,
      fromTimestamp,
      toTimestamp,
    });

  const isInitialLoading = loading && (!transfers || transfers.length === 0);

  // Transform transfers to table data format
  const transformedData = useMemo(() => {
    return transfers.map((transfer) => {
      const timestampSeconds = parseInt(transfer.timestamp);
      const relativeTime = formatRelativeTime(timestampSeconds);

      return {
        id: transfer.transactionHash,
        date: relativeTime,
        amount: formatNumberUserReadable(transfer.amount),
        type: transfer.direction === "in" ? "Buy" : ("Sell" as "Buy" | "Sell"),
        fromAddress: transfer.fromAccountId,
        toAddress: transfer.toAccountId,
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
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = orderDirection === "desc" ? "asc" : "desc";
          setOrderBy("timestamp");
          setOrderDirection(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");
        };
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary w-full justify-start p-0"
            onClick={handleSortToggle}
          >
            <span className="text-xs">Date</span>
            <ArrowUpDown
              props={{ className: "size-4" }}
              activeState={
                orderBy === "timestamp"
                  ? orderDirection === "asc"
                    ? ArrowState.UP
                    : ArrowState.DOWN
                  : ArrowState.DEFAULT
              }
            />
          </Button>
        );
      },
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
        <div className="text-secondary flex w-full items-center justify-end gap-1.5 text-nowrap font-medium">
          <span className="text-xs">Amount ({daoId.toUpperCase()})</span>
          <AmountFilter
            filterId="balance-history-amount-filter"
            onApply={(filterState) => {
              setOrderDirection(
                filterState.sortOrder === "largest-first" ? "desc" : "asc",
              );

              setFilterVariables(() => ({
                fromValue: filterState.minAmount
                  ? parseUnits(filterState.minAmount, decimals).toString()
                  : "",
                toValue: filterState.maxAmount
                  ? parseUnits(filterState.maxAmount, decimals).toString()
                  : "",
              }));

              setIsFilterActive(
                !!(filterVariables?.fromValue || filterVariables?.toValue),
              );

              setOrderBy("amount");
            }}
            onReset={() => {
              setIsFilterActive(false);
              // Reset to default sorting
              setOrderBy("timestamp");
              setFilterVariables(() => ({
                fromValue: "",
                toValue: "",
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
            onValueChange={(value) => {
              setTypeFilter(value as "all" | "buy" | "sell");
              if (value === "all") {
                setCustomFromFilter(null);
                setCustomToFilter(null);
              }
            }}
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
          <div className="group flex w-full items-center justify-between gap-3">
            <div className="text-primary flex max-w-40 items-center gap-2 overflow-hidden">
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
              <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <CopyAndPasteButton
                  textToCopy={fromAddress as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="p-1"
                  iconSize="md"
                />
              </div>
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
              setTypeFilter("all");

              if ((addr ?? "").indexOf(".eth") > 0) {
                const address = await fetchAddressFromEnsName({
                  ensName: addr as `${string}.eth`,
                });
                setCustomFromFilter(address);
                return;
              }
              setCustomFromFilter(addr || null);
            }}
            currentFilter={customFromFilter || undefined}
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
          <div className="group flex w-full items-center justify-between gap-3">
            <div className="text-primary flex max-w-40 items-center gap-2 overflow-hidden">
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
              <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <CopyAndPasteButton
                  textToCopy={toAddress as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="p-1"
                  iconSize="md"
                />
              </div>
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
              setTypeFilter("all");

              if ((addr ?? "").indexOf(".eth") > 0) {
                const address = await fetchAddressFromEnsName({
                  ensName: addr as `${string}.eth`,
                });
                setCustomToFilter(address);
                return;
              }
              setCustomToFilter(addr || null);
            }}
            currentFilter={customToFilter || undefined}
          />
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={balanceHistoryColumns}
      data={isInitialLoading ? Array(12).fill({}) : transformedData}
      size="sm"
      hasMore={hasNextPage}
      isLoadingMore={loading}
      onLoadMore={fetchNextPage}
      wrapperClassName="h-[450px]"
      className="h-[400px]"
      withDownloadCSV={true}
      error={error}
    />
  );
};

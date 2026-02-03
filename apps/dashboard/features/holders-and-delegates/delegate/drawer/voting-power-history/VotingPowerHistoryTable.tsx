"use client";

import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components/FilterSort";
import { ColumnDef } from "@tanstack/react-table";
import { SkeletonRow, Button, IconButton } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { ArrowRight, ExternalLink } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import Link from "next/link";
import {
  useDelegateDelegationHistory,
  DelegationHistoryItem,
} from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";
import daoConfigByDaoId from "@/shared/dao-config";
import { Table } from "@/shared/components/design-system/table/Table";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import {
  AmountFilterState,
  useAmountFilterStore,
} from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import daoConfig from "@/shared/dao-config";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";

interface VotingPowerHistoryTableProps {
  accountId: string;
  daoId: DaoIdEnum;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export const VotingPowerHistoryTable = ({
  accountId,
  daoId,
  fromTimestamp,
  toTimestamp,
}: VotingPowerHistoryTableProps) => {
  const { decimals } = daoConfig[daoId];

  const [sortBy, setSortBy] = useQueryState(
    "orderBy",
    parseAsStringEnum(["timestamp", "delta"]).withDefault("timestamp"),
  );
  const [sortDirection, setSortDirection] = useQueryState(
    "orderDirection",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const [filterVariables, setFilterVariables] = useQueryStates({
    fromValue: parseAsString,
    toValue: parseAsString,
  });
  const [isFilterActive, setIsFilterActive] = useQueryState(
    "active",
    parseAsBoolean.withDefault(false),
  );

  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

  const { delegationHistory, loading, fetchNextPage, error, hasNextPage } =
    useDelegateDelegationHistory({
      accountId,
      daoId,
      orderBy: sortBy,
      orderDirection: sortDirection,
      filterVariables,
      fromTimestamp,
      toTimestamp,
    });

  const isInitialLoading =
    loading && (!delegationHistory || delegationHistory.length === 0);

  const getDelegationType = (item: DelegationHistoryItem) => {
    let statusText = "";

    if (item.type === "transfer") {
      if (item.isGain) {
        statusText = "Delegator Balance Increase";
      } else {
        statusText = "Delegator Balance Decrease";
      }
    } else if (item.type === "delegation") {
      if (item.isGain) {
        statusText = "Delegation";
      } else {
        statusText = "Redelegation";
      }
    }

    if (item.isGain) {
      return {
        type: statusText,
        color: "text-success",
        symbol: "↑",
      };
    }
    return {
      type: statusText,
      color: "text-error",
      symbol: "↓",
    };
  };

  // Table columns configuration
  const columns: ColumnDef<DelegationHistoryItem>[] = [
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        const handleSort = () => {
          const newSortOrder = sortDirection === "desc" ? "asc" : "desc";
          setSortBy("timestamp");
          setSortDirection(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");

          useAmountFilterStore.getState().reset("delegation-amount-filter");
          setIsFilterActive(false);
        };
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary w-full justify-start p-0"
            onClick={handleSort}
          >
            <h4 className="text-table-header">Date</h4>
            <ArrowUpDown
              props={{ className: "size-4" }}
              activeState={
                sortBy === "timestamp"
                  ? sortDirection === "asc"
                    ? ArrowState.UP
                    : ArrowState.DOWN
                  : ArrowState.DEFAULT
              }
            />
          </Button>
        );
      },
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp") as string;

        if (isInitialLoading) {
          return (
            <div className="flex items-center justify-start px-4">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start">
            <span className="text-primary whitespace-nowrap text-sm font-medium">
              {formatRelativeTime(timestamp, {
                skipMonthsAndWeeks: true,
              })}
            </span>
          </div>
        );
      },
      meta: {
        columnClassName: "w-32",
      },
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="flex items-center gap-1.5">
          <h4 className="text-table-header">Amount ({daoId})</h4>
          <AmountFilter
            filterId="delegation-amount-filter"
            onApply={(filterState: AmountFilterState) => {
              if (filterState.sortOrder) {
                setSortDirection(
                  filterState.sortOrder === "largest-first" ? "desc" : "asc",
                );
                setSortBy("delta");
              } else {
                setSortBy("timestamp");
                setSortDirection("desc");
              }

              setFilterVariables(() => ({
                fromValue: filterState.minAmount
                  ? parseUnits(filterState.minAmount, decimals).toString()
                  : "",
                toValue: filterState.maxAmount
                  ? parseUnits(filterState.maxAmount, decimals).toString()
                  : "",
              }));

              setIsFilterActive(
                !!(
                  filterState.minAmount ||
                  filterState.maxAmount ||
                  filterState.sortOrder
                ),
              );
            }}
            onReset={() => {
              setIsFilterActive(false);
              setSortBy("timestamp");
              setSortDirection("desc");
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
      cell: ({ row }) => {
        const item = row.original;
        const delegationType = getDelegationType(item);

        if (isInitialLoading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        let amount = "0";
        if (item.delegation) {
          amount = formatNumberUserReadable(
            Number(formatUnits(BigInt(item.delegation.value), decimals)),
          );
        } else if (item.transfer) {
          amount = formatNumberUserReadable(
            Number(formatUnits(BigInt(item.transfer.value), decimals)),
          );
        } else {
          // Auto delegation protocols wont have neither delegation nor transfer, so we use the delta
          amount = item.delta;
        }

        return (
          <div className="flex h-[52px] flex-col items-start justify-center">
            <div className="flex items-center gap-1">
              <span className={cn("text-sm font-medium", delegationType.color)}>
                {delegationType.symbol}
                {amount}
              </span>
            </div>
            <span className="text-secondary whitespace-nowrap text-xs">
              {delegationType.type}
            </span>
          </div>
        );
      },
      meta: {
        columnClassName: "w-52",
      },
    },
    {
      accessorKey: "delegator",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Delegator</span>
          {/* <AddressFilter
            onApply={async (addr) => {
              if (!addr) {
                setFromFilter(null);
                return;
              }
              if (addr.indexOf(".eth") > 0) {
                const address = await fetchAddressFromEnsName({
                  ensName: addr as `${string}.eth`,
                });
                setFromFilter(address);
                return;
              }
              if (isAddress(addr)) {
                setFromFilter(addr);
              }
            }}
            currentFilter={fromFilter ?? ""}
          /> */}
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;

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

        // Get delegator address based on the transaction type and direction
        let delegatorAddress: Address = zeroAddress;
        if (item.delegation) {
          delegatorAddress = item.delegation.from as Address;
        } else if (item.transfer) {
          // For transfers: if delta is negative, fromAccountId is delegator
          // If delta is positive, toAccountId is delegator
          delegatorAddress = item.isGain
            ? (item.transfer.to as Address)
            : (item.transfer.from as Address);
        } else if (Number(item.delta) < 0) {
          delegatorAddress = accountId as Address;
        }

        return (
          <div className="group flex items-center gap-3">
            <div className="overflow-truncate flex max-w-[140px] items-center gap-2">
              <EnsAvatar
                address={delegatorAddress as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                nameClassName={cn(
                  "truncate max-w-[125px]",
                  delegatorAddress === accountId
                    ? "text-primary"
                    : "text-secondary",
                )}
              />
              <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <CopyAndPasteButton
                  textToCopy={delegatorAddress as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="p-1"
                  iconSize="md"
                />
              </div>
            </div>
          </div>
        );
      },
      meta: {
        columnClassName: "w-32",
      },
    },
    {
      accessorKey: "arrow",
      header: () => <div className="w-full"></div>,
      cell: () => {
        if (isInitialLoading) {
          return <div className="flex items-center justify-center"></div>;
        }

        return (
          <div className="flex items-center justify-center">
            <ArrowRight className="text-secondary size-4" />
          </div>
        );
      },
      meta: {
        columnClassName: "w-16",
      },
    },
    {
      accessorKey: "delegate",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Delegate</span>
          {/* <AddressFilter
            onApply={async (addr) => {
              if (!addr) {
                setToFilter(null);
                return;
              }
              if (addr.indexOf(".eth") > 0) {
                const address = await fetchAddressFromEnsName({
                  ensName: addr as `${string}.eth`,
                });
                setToFilter(address);
                return;
              }
              if (isAddress(addr)) {
                setToFilter(addr);
              }
            }}
            currentFilter={toFilter ?? ""}
          /> */}
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;

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

        // Get delegate address based on the transaction type and direction
        let delegateAddress: Address = zeroAddress;
        if (item.delegation) {
          // For delegation, delegate is the one receiving the delegation
          delegateAddress = item.delegation.to as Address;
        } else if (item.transfer) {
          // For transfers, the selected address should always be at the delegates column
          delegateAddress = accountId as Address;
        } else if (Number(item.delta) > 0) {
          delegateAddress = accountId as Address;
        }

        return (
          <div className="group flex items-center justify-between gap-3">
            <div className="flex max-w-[140px] items-center gap-2 overflow-hidden">
              <EnsAvatar
                address={delegateAddress as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                nameClassName={cn(
                  "truncate max-w-[125px]",
                  delegateAddress === accountId
                    ? "text-primary"
                    : "text-secondary",
                )}
              />
              <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <CopyAndPasteButton
                  textToCopy={delegateAddress as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="p-1"
                  iconSize="md"
                />
              </div>
            </div>
            <Link
              href={`${daoConfigByDaoId[daoId].daoOverview.chain.blockExplorers?.default.url}/tx/${item.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer"
            >
              <IconButton variant="ghost" icon={ExternalLink} />
            </Link>
          </div>
        );
      },
      meta: {
        columnClassName: "w-32",
      },
    },
  ];

  return (
    <div className="flex w-full flex-col gap-2 p-4">
      <Table
        columns={columns}
        data={isInitialLoading ? Array(12).fill({}) : delegationHistory}
        size="sm"
        hasMore={hasNextPage}
        isLoadingMore={loading}
        onLoadMore={fetchNextPage}
        wrapperClassName="h-[450px]"
        className="h-[400px]"
        withDownloadCSV={true}
        error={error}
      />
    </div>
  );
};

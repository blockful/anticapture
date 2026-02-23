"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";

import {
  useDelegateDelegationHistory,
  DelegationHistoryItem,
} from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { SkeletonRow, Button, IconButton } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { DateCell } from "@/shared/components/design-system/table/cells/DateCell";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components/FilterSort";
import { useAmountFilterStore } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn } from "@/shared/utils";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

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
  const limit: number = 20;
  const { decimals } = daoConfigByDaoId[daoId];

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
      limit,
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
            <DateCell timestampSeconds={timestamp} className="font-medium" />
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
            onApply={(filterState) => {
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
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Table
        columns={columns}
        data={
          isInitialLoading
            ? Array(DEFAULT_ITEMS_PER_PAGE).fill({})
            : delegationHistory
        }
        size="sm"
        hasMore={hasNextPage}
        isLoadingMore={loading}
        onLoadMore={fetchNextPage}
        withDownloadCSV={true}
        error={error}
        fillHeight
      />
    </div>
  );
};

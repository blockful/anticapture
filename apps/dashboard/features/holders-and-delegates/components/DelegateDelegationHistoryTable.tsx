import { useState } from "react";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components/FilterSort";
import { ColumnDef } from "@tanstack/react-table";
import { SkeletonRow, Button, IconButton } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import { formatUnits, parseEther } from "viem";
import { ArrowRight, ExternalLink } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import Link from "next/link";
import {
  useDelegateDelegationHistory,
  DelegationHistoryItem,
  AmountFilterVariables,
} from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";
import daoConfigByDaoId from "@/shared/dao-config";
import { Table } from "@/shared/components/design-system/table/Table";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import daoConfig from "@/shared/dao-config";

interface DelegateDelegationHistoryTableProps {
  accountId: string;
  daoId: DaoIdEnum;
}

export const DelegateDelegationHistoryTable = ({
  accountId,
  daoId,
}: DelegateDelegationHistoryTableProps) => {
  const {
    daoOverview: { token },
  } = daoConfig[daoId];
  const [sortBy, setSortBy] = useState<"timestamp" | "delta">("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterVariables, setFilterVariables] =
    useState<AmountFilterVariables>();
  const [isFilterActive, setIsFilterActive] = useState(false);

  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

  const {
    delegationHistory,
    loading,
    paginationInfo,
    fetchNextPage,
    fetchingMore,
    error,
  } = useDelegateDelegationHistory(
    accountId,
    daoId,
    sortBy,
    sortDirection,
    filterVariables,
  );

  // Handle sorting
  const handleSort = (field: "timestamp" | "delta") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc"); // Always start with desc for new sort field
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
    } else if (diffInWeeks > 0) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  // Determine delegation type and color based on gain/loss
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
      meta: {
        columnClassName: "w-32",
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start p-0"
          onClick={() => handleSort("timestamp")}
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
      ),
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp") as string;

        if (loading) {
          return (
            <div className="flex items-center justify-start px-4">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start">
            <span className="text-primary whitespace-nowrap text-sm font-medium">
              {formatRelativeTime(timestamp)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      meta: {
        columnClassName: "w-52",
      },
      header: () => (
        <div className="flex items-center gap-1.5">
          <h4 className="text-table-header">Amount ({daoId})</h4>
          <AmountFilter
            onApply={(filterState: AmountFilterState) => {
              setSortDirection(
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
              // Update sort to delta when filter is applied
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
      cell: ({ row }) => {
        const item = row.original;
        const delegationType = getDelegationType(item);

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-16" />
            </div>
          );
        }

        let amount = "0";
        if (item.delegation) {
          amount = formatNumberUserReadable(
            token === "ERC20"
              ? Number(formatUnits(BigInt(item.delegation.value), 18))
              : Number(item.delegation.value),
          );
        } else if (item.transfer) {
          amount = formatNumberUserReadable(
            token === "ERC20"
              ? Number(formatUnits(BigInt(item.transfer.value), 18))
              : Number(item.transfer.value),
          );
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
    },
    {
      accessorKey: "delegator",
      meta: {
        columnClassName: "w-32",
      },
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-start">
          Delegator
        </h4>
      ),
      cell: ({ row }) => {
        const item = row.original;

        if (loading) {
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
        let delegatorAddress = "";
        if (item.delegation) {
          delegatorAddress = item.delegation.from;
        } else if (item.transfer) {
          // For transfers: if delta is negative, fromAccountId is delegator
          // If delta is positive, toAccountId is delegator
          delegatorAddress = item.isGain
            ? item.transfer.to
            : item.transfer.from;
        }

        return (
          <div className="flex items-center gap-3">
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
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "arrow",
      meta: {
        columnClassName: "w-16",
      },
      header: () => <div className="w-full"></div>,
      cell: () => {
        if (loading) {
          return <div className="flex items-center justify-center"></div>;
        }

        return (
          <div className="flex items-center justify-center">
            <ArrowRight className="text-secondary size-4" />
          </div>
        );
      },
    },
    {
      accessorKey: "delegate",
      meta: {
        columnClassName: "w-32",
      },
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-start">
          Delegate
        </h4>
      ),
      cell: ({ row }) => {
        const item = row.original;

        if (loading) {
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
        let delegateAddress = accountId;
        if (item.delegation) {
          // For delegation, delegate is the one receiving the delegation
          delegateAddress = item.delegation.to;
        } else if (item.transfer) {
          // For transfers, the selected address should always be at the delegates column
          delegateAddress = accountId;
        }

        return (
          <div className="flex items-center justify-between gap-3">
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
    },
  ];

  if (loading && delegationHistory.length === 0) {
    return (
      <div className="bg-surface-default flex flex-col">
        {/* Table */}
        <div className="flex flex-col gap-2 p-4">
          <Table
            columns={columns}
            data={Array.from({ length: 12 }, () => ({
              timestamp: "1716153600",
              transactionHash: "0x1234567890",
              delta: "1000000000000000000",
              delegation: null,
              transfer: null,
              votingPower: "1000000000000000000",
              type: "delegation" as const,
              action: "Delegation",
              isGain: true,
              delegator: "0x1234567890",
              delegate: "0x1234567890",
            }))}
            className="h-[400px]"
            wrapperClassName="h-[450px]"
            withDownloadCSV={true}
            size="sm"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface-default flex flex-col items-center justify-center p-4">
        <div className="text-danger text-center">
          <p className="text-lg font-semibold">
            Error loading delegation history
          </p>
          <p className="mt-2 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <Table
        columns={columns}
        data={delegationHistory}
        size="sm"
        hasMore={paginationInfo.hasNextPage}
        isLoadingMore={fetchingMore}
        onLoadMore={fetchNextPage}
        withDownloadCSV={true}
        wrapperClassName="h-[450px]"
        className="h-[400px]"
      />
    </div>
  );
};

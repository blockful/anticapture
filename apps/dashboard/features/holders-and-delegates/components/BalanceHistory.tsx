import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TheTable, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { ArrowRight, ExternalLink, Filter, Check } from "lucide-react";
import { useBalanceHistory } from "../hooks/useBalanceHistory";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

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
  daoId: string;
}

export const BalanceHistory = ({ accountId, daoId }: BalanceHistoryProps) => {
  const [sortBy, setSortBy] = useState<string>("date");
  const [typeFilter, setTypeFilter] = useState<"all" | "Buy" | "Sell">("all");
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [orderBy, setOrderBy] = useState<string>("timestamp");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");

  // Convert UI filter to hook filter format
  const transactionType =
    typeFilter === "Buy" ? "buy" : typeFilter === "Sell" ? "sell" : "all";

  // Use the balance history hook
  const {
    transfers,
    loading,
    error,
    paginationInfo,
    fetchNextPage,
    fetchPreviousPage,
  } = useBalanceHistory(
    accountId,
    daoId,
    orderBy,
    orderDirection,
    transactionType,
  );

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

  // Handle loading state with skeleton data
  const tableData = useMemo(() => {
    if (loading) {
      // Return skeleton data while loading
      return Array.from({ length: 10 }, (_, i) => ({
        id: `skeleton-${i}`,
        date: "",
        amount: "",
        type: "Buy" as "Buy" | "Sell",
        fromAddress: "",
        toAddress: "",
      }));
    }
    return transformedData;
  }, [loading, transformedData]);

  const balanceHistoryColumns: ColumnDef<BalanceHistoryData>[] = [
    {
      accessorKey: "date",
      size: 120,
      cell: ({ row }) => {
        const date = row.getValue("date") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center px-2 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-20"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center px-2 py-2">
            <span className="text-primary text-sm">{date}</span>
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header h-8 w-full justify-start px-2 text-sm"
          onClick={() => handleSort("date")}
        >
          <span className="text-xs">Date</span>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
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
      size: 120,
      cell: ({ row }) => {
        const amount = row.getValue("amount") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-end px-2 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-end px-2 py-2">
            <span className="text-secondary text-sm font-medium">{amount}</span>
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header h-8 w-full justify-end px-2 text-sm"
          onClick={() => handleSort("amount")}
        >
          <span className="text-xs">Amount ({daoId.toUpperCase()})</span>
          <ArrowUpDown
            props={{ className: " size-4" }}
            activeState={
              sortBy === "amount"
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
      accessorKey: "type",
      size: 80,
      cell: ({ row }) => {
        const type = row.getValue("type") as "Buy" | "Sell";

        if (loading) {
          return (
            <div className="flex h-10 items-center px-2 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-6 w-12 rounded-full"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center px-2 py-2">
            <BadgeStatus variant="dimmed">{type}</BadgeStatus>
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-2 px-2">
          <h4 className="text-table-header text-xs">Type</h4>
          <div className="relative">
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className={cn(
                "group flex cursor-pointer items-center rounded-sm border p-1 transition-colors",
                "hover:border-highlight bg-surface-hover border-transparent",
                showTypeFilter && "border-highlight bg-surface-hover",
              )}
            >
              <Filter className="text-primary size-3" />
            </button>

            {showTypeFilter && (
              <div className="bg-surface-contrast absolute top-0 left-0 z-50 mt-9 min-w-[150px] rounded-md border border-[#3F3F46] py-1">
                <button
                  onClick={() => {
                    setTypeFilter("all");
                    setShowTypeFilter(false);
                  }}
                  className={cn(
                    "hover:bg-surface-hover flex w-full items-center justify-between border-b border-[#3F3F46] px-3 py-2 text-left",
                    typeFilter === "all" && "bg-surface-hover",
                  )}
                >
                  <span className="text-primary text-sm font-normal whitespace-nowrap">
                    Remove All
                  </span>
                  {typeFilter === "all" && (
                    <Check className="text-primary size-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setTypeFilter("Buy");
                    setShowTypeFilter(false);
                  }}
                  className={cn(
                    "hover:bg-surface-hover flex w-full items-center justify-between px-3 py-2 text-left",
                    typeFilter === "Buy" && "bg-surface-hover",
                  )}
                >
                  <span className="text-primary text-sm font-normal">Buy</span>
                  {typeFilter === "Buy" && (
                    <Check className="text-primary size-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setTypeFilter("Sell");
                    setShowTypeFilter(false);
                  }}
                  className={cn(
                    "hover:bg-surface-hover flex w-full items-center justify-between px-3 py-2 text-left",
                    typeFilter === "Sell" && "bg-surface-hover",
                  )}
                >
                  <span className="text-primary text-sm font-normal">Sell</span>
                  {typeFilter === "Sell" && (
                    <Check className="text-primary size-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "fromAddress",
      size: 204,
      cell: ({ row }) => {
        const fromAddress = row.getValue("fromAddress") as string;
        const fromEns = row.original.fromEns;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 px-2 py-2">
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
          <div className="flex h-10 w-full items-center justify-between gap-3 px-2 py-2">
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
      header: () => <h4 className="text-table-header px-2 text-xs">From</h4>,
    },
    {
      accessorKey: "toAddress",
      size: 204,
      cell: ({ row }) => {
        const toAddress = row.getValue("toAddress") as string;
        const toEns = row.original.toEns;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 px-2 py-2">
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
          <div className="flex h-10 w-full items-center justify-between gap-3 px-2 py-2">
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
              href={`https://etherscan.io/tx/${row.original.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon">
                <ExternalLink className="text-primary size-4" />
              </Button>
            </a>
          </div>
        );
      },
      header: () => <h4 className="text-table-header px-2 text-xs">To</h4>,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-2 p-4">
      <TheTable
        columns={balanceHistoryColumns}
        data={tableData}
        isTableSmall={true}
      />

      {/* Pagination */}
      <Pagination
        currentPage={paginationInfo.currentPage}
        totalPages={paginationInfo.totalPages}
        onPrevious={fetchPreviousPage}
        onNext={fetchNextPage}
        hasNextPage={paginationInfo.hasNextPage}
        hasPreviousPage={paginationInfo.hasPreviousPage}
      />
    </div>
  );
};

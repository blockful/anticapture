import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TheTable, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { cn } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { Filter } from "lucide-react";
import { useBalanceHistory, Transfer } from "../hooks/useBalanceHistory";
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
}

export const BalanceHistory = ({ accountId }: BalanceHistoryProps) => {
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
  } = useBalanceHistory(accountId, orderBy, orderDirection, transactionType);

  // Handle sorting - both date and amount now control the GraphQL query
  const handleSort = (field: string) => {
    if (field === "date") {
      const newOrderBy = "timestamp";
      const newOrderDirection =
        orderBy === "timestamp" && orderDirection === "asc" ? "desc" : "asc";
      setOrderBy(newOrderBy);
      setOrderDirection(newOrderDirection);
      setSortBy("date");
    } else if (field === "amount") {
      const newOrderBy = "amount";
      const newOrderDirection =
        orderBy === "amount" && orderDirection === "asc" ? "desc" : "asc";
      setOrderBy(newOrderBy);
      setOrderDirection(newOrderDirection);
      setSortBy("amount");
    }
  };

  // Transform transfers to table data format
  const transformedData = useMemo(() => {
    return transfers.map((transfer) => ({
      id: transfer.transactionHash,
      date: new Date(parseInt(transfer.timestamp) * 1000).toLocaleDateString(),
      amount: formatNumberUserReadable(parseFloat(transfer.amount)),
      type: transfer.direction === "in" ? "Buy" : ("Sell" as "Buy" | "Sell"),
      fromAddress: transfer.fromAccountId || "",
      toAddress: transfer.toAccountId || "",
    }));
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
      size: 150,
      cell: ({ row }) => {
        const date = row.getValue("date") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center px-4 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-20"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center px-4 py-2">
            <span className="text-secondary text-sm">{date}</span>
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-start px-4"
          onClick={() => handleSort("date")}
        >
          Date
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
      enableSorting: true,
    },
    {
      accessorKey: "amount",
      size: 200,
      cell: ({ row }) => {
        const amount = row.getValue("amount") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-end px-4 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-24"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-end px-4 py-2">
            <span className="text-primary text-sm font-medium">
              {amount} ENS
            </span>
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-end px-4"
          onClick={() => handleSort("amount")}
        >
          Amount
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
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
      enableSorting: true,
    },
    {
      accessorKey: "type",
      size: 120,
      cell: ({ row }) => {
        const type = row.getValue("type") as "Buy" | "Sell";

        if (loading) {
          return (
            <div className="flex h-10 items-center px-4 py-2">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-6 w-12 rounded-full"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center px-4 py-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                type === "Buy"
                  ? "bg-success/20 text-success"
                  : "bg-error/20 text-error",
              )}
            >
              {type}
            </span>
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-2 px-4">
          <h4 className="text-table-header">Type</h4>
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
              <div className="bg-surface-default absolute top-8 left-0 z-10 min-w-[100px] rounded-md border border-white/10 shadow-lg">
                <div className="p-1">
                  <button
                    onClick={() => {
                      setTypeFilter("all");
                      setShowTypeFilter(false);
                    }}
                    className={cn(
                      "hover:bg-surface-hover w-full rounded px-2 py-1 text-left text-sm",
                      typeFilter === "all" && "bg-surface-hover",
                    )}
                  >
                    Remove all
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter("Buy");
                      setShowTypeFilter(false);
                    }}
                    className={cn(
                      "hover:bg-surface-hover w-full rounded px-2 py-1 text-left text-sm",
                      typeFilter === "Buy" && "bg-surface-hover",
                    )}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter("Sell");
                      setShowTypeFilter(false);
                    }}
                    className={cn(
                      "hover:bg-surface-hover w-full rounded px-2 py-1 text-left text-sm",
                      typeFilter === "Sell" && "bg-surface-hover",
                    )}
                  >
                    Sell
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "fromAddress",
      size: 280,
      cell: ({ row }) => {
        const fromAddress = row.getValue("fromAddress") as string;
        const fromEns = row.original.fromEns;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 px-4 py-2">
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
          <div className="flex h-10 items-center gap-3 px-4 py-2">
            <EnsAvatar
              address={fromAddress as `0x${string}`}
              size="sm"
              variant="rounded"
              showName={true}
            />
          </div>
        );
      },
      header: () => <h4 className="text-table-header px-4">From</h4>,
      enableSorting: false,
    },
    {
      accessorKey: "toAddress",
      size: 280,
      cell: ({ row }) => {
        const toAddress = row.getValue("toAddress") as string;
        const toEns = row.original.toEns;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 px-4 py-2">
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
          <div className="flex h-10 items-center gap-3 px-4 py-2">
            <EnsAvatar
              address={toAddress as `0x${string}`}
              size="sm"
              variant="rounded"
              showName={true}
            />
          </div>
        );
      },
      header: () => <h4 className="text-table-header px-4">To</h4>,
      enableSorting: false,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <TheTable
        columns={balanceHistoryColumns}
        data={tableData}
        withSorting={true}
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

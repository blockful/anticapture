import { SkeletonRow } from "@/shared/components";
import {
  SupplyLabel,
  SupplyType,
} from "@/shared/components/badges/SupplyLabel";
import { ArrowUp, ArrowDown, ExternalLink, ArrowRight } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { AmountFilter } from "@/shared/components/design-system/table/filters/AmountFilter";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/components/ui/button";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { TransactionData } from "@/features/transactions/hooks/useTransactionsTableData";
import Link from "next/link";
import { fetchEnsData } from "@/shared/hooks/useEnsData";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { cn } from "@/shared/utils";

export const getTransactionsColumns = ({
  loading,
  daoId,
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
}: {
  loading: boolean;
  daoId: DaoIdEnum;
  minAmount: number | undefined;
  maxAmount: number | undefined;
  setMinAmount: (min: number | undefined) => void;
  setMaxAmount: (max: number | undefined) => void;
  fromFilter: string;
  setFromFilter: (from: string) => void;
  toFilter: string;
  setToFilter: (to: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
}): ColumnDef<TransactionData>[] => {
  return [
    {
      accessorKey: "affectedSupply",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center whitespace-nowrap px-2">
          Affected Supply
        </div>
      ),
      cell: ({ row }) => {
        const supplies = row.getValue("affectedSupply") as SupplyType[];

        if (loading) {
          return (
            <div className="flex flex-wrap gap-2 px-2">
              <SkeletonRow className="h-5 w-16" />
              <SkeletonRow className="h-5 w-12" />
            </div>
          );
        }

        return (
          <div className="flex flex-wrap gap-2">
            {supplies.map((supply, index) => (
              <SupplyLabel key={index} type={supply} />
            ))}
          </div>
        );
      },
      size: 180,
    },
    {
      accessorKey: "amount",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-end whitespace-nowrap px-2">
          <span className="mr-2">Amount ({daoId?.toUpperCase()})</span>
          <AmountFilter
            onApply={(params) => {
              const { min, max } = params;
              setMinAmount(min);
              setMaxAmount(max);
            }}
            currentMin={minAmount}
            currentMax={maxAmount}
          />
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as string;
        const hasSubRows =
          row.original.subRows && row.original.subRows.length > 0;
        const isNestedRow = row.depth > 0;
        const isDelegation =
          row.original.affectedSupply?.includes("Delegation");

        if (loading) {
          return (
            <div className="mr-2 flex w-full items-center justify-end gap-2">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        return (
          <div className="mr-2 flex w-full items-center justify-end gap-2">
            {hasSubRows ? (
              <span className="text-secondary">{amount.toLocaleString()}</span>
            ) : isNestedRow && isDelegation ? (
              <div className="flex items-center gap-1">
                <ArrowUp className="text-success size-3.5" />
                <span className="text-success">{amount.toLocaleString()}</span>
              </div>
            ) : !isNestedRow ? (
              <div className="flex items-center gap-1">
                {amount[0] !== "-" && amount !== "0" ? (
                  <>
                    <ArrowUp className="text-success size-3.5" />
                    <span className="text-success">
                      {amount.toLocaleString()}
                    </span>
                  </>
                ) : amount[0] === "-" ? (
                  <>
                    <ArrowDown className="text-error size-3.5" />
                    <span className="text-error">
                      {amount.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-secondary">
                    {amount.toLocaleString()}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-secondary">{amount.toLocaleString()}</span>
            )}
          </div>
        );
      },
      size: 162,
    },
    {
      accessorKey: "date",
      header: () => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-start px-4 py-0"
          onClick={() => {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
          }}
        >
          Date
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              sortOrder === "asc"
                ? ArrowState.UP
                : sortOrder === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue("date") as string;

        if (loading) {
          return (
            <div className="flex items-center justify-start px-4">
              <SkeletonRow className="h-4 w-16" />
            </div>
          );
        }

        return date ? (
          <span className="text-secondary w-full px-4 text-sm">{date}</span>
        ) : null;
      },
      size: 162,
    },
    {
      accessorKey: "from",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-4">
          <span>From</span>
          <div className="ml-2 w-[180px]">
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
        </div>
      ),
      cell: ({ row }) => {
        const from = row.getValue("from") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 p-2">
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
          <div className="flex h-10 items-center gap-3 p-2">
            <div className="overflow-truncate flex max-w-[140px] items-center gap-2">
              <EnsAvatar
                address={from as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                nameClassName={cn("truncate max-w-[125px]")}
              />
            </div>
          </div>
        );
      },
      size: 162,
    },
    {
      id: "arrow",
      header: "",
      cell: () => {
        if (loading) {
          return (
            <div className="flex h-10 items-center justify-center px-2"></div>
          );
        }

        return <ArrowRight className="h-3 w-3 text-white opacity-50" />;
      },
      size: 40,
    },
    {
      accessorKey: "to",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-4">
          <span>To</span>
          <div className="ml-2 w-[180px]">
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
        </div>
      ),
      cell: ({ row }) => {
        const to = row.getValue("to") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 p-2">
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
          <div className="flex h-10 items-center gap-3 p-2">
            <div className="overflow-truncate flex max-w-[140px] items-center gap-2">
              <EnsAvatar
                address={to as `0x${string}`}
                size="sm"
                variant="rounded"
                showName={true}
                nameClassName={cn("truncate max-w-[125px]")}
              />
            </div>
          </div>
        );
      },
      size: 162,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const txHash = row.original.txHash;
        const isNestedRow = row.depth > 0;

        if (loading) {
          return (
            <div className="flex h-10 items-center justify-center px-2"></div>
          );
        }

        if (isNestedRow) {
          return (
            <div className="flex h-10 items-center justify-center px-2"></div>
          );
        }

        return (
          <Link
            href={"https://etherscan.io/tx/" + txHash}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3 text-white opacity-50" />
          </Link>
        );
      },
      size: 40,
    },
  ];
};

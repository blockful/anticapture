"use client";

import { useState } from "react";
import { TheTable } from "@/shared/components/tables/TheTable";
import {
  SupplyLabel,
  SupplyType,
} from "@/shared/components/badges/SupplyLabel";
import { ArrowUp, ArrowDown, ExternalLink, ArrowRight } from "lucide-react";
import { useTransactionsTableData } from "@/features/expandable-table-demo";
import { DaoIdEnum } from "@/shared/types/daos";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { AddressFilter } from "@/shared/components/design-system/filters/AddressFilter";
import { AmountFilter } from "@/shared/components/design-system/filters/AmountFilter";
import { useParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/shared/components/ui/button";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { TransactionData } from "@/features/expandable-table-demo/hooks/useTransactionsTableData";
import Link from "next/link";
import { fetchEnsData } from "@/shared/hooks/useEnsData";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { cn } from "@/shared/utils";

export const ExpandableTableDemoSection = () => {
  const { daoId } = useParams<{ daoId: DaoIdEnum }>();

  // Filters
  const [fromFilter, setFromFilter] = useState<string>("");
  const [toFilter, setToFilter] = useState<string>("");
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  // Using ENS as default dao for demo, can be parameterized later
  const {
    data: tableData,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    loading,
  } = useTransactionsTableData({
    daoId: DaoIdEnum.ENS,
    limit: 10,
    offset: 0,
    filters: {
      from: fromFilter || undefined,
      to: toFilter || undefined,
      minAmount,
      maxAmount,
      sortOrder,
    },
  });
  const columns: ColumnDef<TransactionData>[] = [
    {
      accessorKey: "affectedSupply",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center whitespace-nowrap px-2">
          Affected Supply
        </div>
      ),
      cell: ({ row }) => {
        const supplies = row.getValue("affectedSupply") as SupplyType[];
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
            onApply={({ min, max }) => {
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

        return (
          <div className="mr-2 flex w-full items-center justify-end gap-2">
            {hasSubRows ? (
              // If has subRows, show amount with text-secondary
              <span className="text-secondary">{amount.toLocaleString()}</span>
            ) : (
              // If no subRows, show amount with arrow and appropriate color
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
          className="!text-table-header w-full justify-start px-4"
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
      cell: () => <ArrowRight className="h-3 w-3 text-white opacity-50" />,
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

  return (
    <div className="w-full">
      <div className="bg-surface-default flex flex-col p-4">
        {/* Amount filter moved to column header via AmountFilter */}
        <TheTable
          columns={columns}
          data={tableData as TransactionData[]}
          enableExpanding={true}
          getSubRows={(row) => row.subRows}
          stickyFirstColumn={true}
          withSorting={true}
          withPagination={true}
          isTableSmall={true}
          className="border-0"
          showParentDividers={true}
          mobileTableFixed={true}
        />

        {/* Pagination */}
        <div className="mt-3">
          <Pagination
            currentPage={pagination.currentPage}
            onPrevious={fetchPreviousPage}
            onNext={fetchNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
};

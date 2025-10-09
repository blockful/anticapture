"use client";

import { Button, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { useDelegationHistory } from "@/features/holders-and-delegates/hooks/useDelegationHistory";
import { formatUnits } from "viem";
import {
  formatNumberUserReadable,
  formatDateUserReadable,
} from "@/shared/utils/";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { AlertOctagon, Inbox } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";

import { DaoIdEnum } from "@/shared/types/daos";
import { Table } from "@/shared/components/design-system/table/Table";

interface DelegationData {
  address: string;
  amount: string;
  date: string;
  timestamp: number;
}

export const DelegationHistoryTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: DaoIdEnum;
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"timestamp" | "delegatedValue">(
    "timestamp",
  );
  const {
    data: delegationHistory,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchingMore,
  } = useDelegationHistory({
    daoId,
    delegatorAccountId: address,
    orderBy: sortBy,
    orderDirection: sortOrder,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data: DelegationData[] =
    delegationHistory?.map((delegation) => {
      const delegateAddress = delegation.delegate?.id || "";
      const votingPower =
        delegation.delegate?.powers?.items?.[0]?.votingPower || "0";
      const timestamp = delegation.timestamp || 0;

      const formattedAmount =
        votingPower !== "0"
          ? Number(formatUnits(BigInt(votingPower), 18)).toFixed(2)
          : "0";

      const date = timestamp
        ? formatDateUserReadable(new Date(Number(timestamp) * 1000))
        : "Unknown";

      return {
        address: delegateAddress,
        amount: formattedAmount,
        date,
        timestamp: Number(timestamp),
      };
    }) || [];

  const delegationHistoryColumns: ColumnDef<DelegationData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          Delegate Address
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <div className="flex items-center gap-2">
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

        const addressValue: string = row.getValue("address");
        return (
          <div className="flex w-full items-center gap-2">
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
            />
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
          setSortBy("delegatedValue");
          setSortOrder(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");
        };

        return (
          <div className="text-table-header flex w-full items-center justify-end">
            Amount ({daoId})
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary justify-end"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{ className: "ml-2 size-4" }}
                activeState={
                  sortBy === "delegatedValue"
                    ? sortOrder === "asc"
                      ? ArrowState.UP
                      : ArrowState.DOWN
                    : ArrowState.DEFAULT
                }
              />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <div className="flex w-full items-center justify-end">
              <SkeletonRow
                parentClassName="flex animate-pulse justify-end"
                className="h-4 w-16"
              />
            </div>
          );
        }

        const amount: string = row.getValue("amount");

        return (
          <div className="flex w-full items-center justify-end text-sm">
            {formatNumberUserReadable(Number(amount), 1)}
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
          setSortBy("timestamp");
          setSortOrder(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");
        };
        return (
          <div className="text-table-header flex w-full items-center justify-start">
            Date
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary justify-end"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{ className: "ml-2 size-4" }}
                activeState={
                  sortBy === "timestamp"
                    ? sortOrder === "asc"
                      ? ArrowState.UP
                      : ArrowState.DOWN
                    : ArrowState.DEFAULT
                }
              />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-4 w-20"
            />
          );
        }

        const date: string = row.getValue("date");

        return (
          <div className="flex w-full items-center justify-start text-sm">
            {date}
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <BlankSlate
          variant="title"
          icon={AlertOctagon}
          title="Failed to load the API definition"
          description="Please check your network connection and refresh the page."
        />
      </div>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No delegation history found for this address"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="h-full w-full overflow-y-auto">
        <Table
          size="sm"
          columns={delegationHistoryColumns}
          data={loading ? Array(12).fill({}) : data}
          filterColumn="address"
          hasMore={pagination.hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          withDownloadCSV={true}
          wrapperClassName="h-[450px]"
          className="h-[400px]"
        />
      </div>
    </div>
  );
};

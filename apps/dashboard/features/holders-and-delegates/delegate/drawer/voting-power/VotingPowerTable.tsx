"use client";

import { useEffect, useState } from "react";

import { SkeletonRow, TheTable } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { Address } from "viem";
import { BlankState } from "@/shared/components/design-system/blank-state/BlankState";
import { AlertOctagon, Inbox } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";

export const VotingPowerTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: string;
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"balance">("balance");

  const {
    balances,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore,
  } = useVotingPower({
    daoId: daoId as DaoIdEnum,
    address: address,
    orderBy: sortBy,
    orderDirection: sortOrder,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tableData = balances.map((account) => {
    return {
      address: account.accountId,
      amount: Number(account.balance) || 0,
      date: account.timestamp,
    };
  });

  const columns: ColumnDef<{
    address: string;
    amount: number;
    date: string;
  }>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          Address
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <div className="flex h-10 w-full items-center gap-3 px-2">
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
          <div className="flex h-10 w-full items-center gap-2 px-2">
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
          setSortBy("balance");
          setSortOrder(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");
        };
        return (
          <div className="text-table-header flex h-8 w-full items-center justify-end whitespace-nowrap px-2">
            Amount ({daoId})
            <button
              className="!text-table-header cursor-pointer justify-end text-end"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{ className: "ml-2 size-4" }}
                activeState={
                  sortBy === "balance" && sortOrder === "asc"
                    ? ArrowState.UP
                    : sortBy === "balance" && sortOrder === "desc"
                      ? ArrowState.DOWN
                      : ArrowState.DEFAULT
                }
              />
            </button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse justify-end"
              className="h-4 w-16"
            />
          );
        }
        const amount: number = row.getValue("amount");
        return (
          <div className="flex h-10 w-full items-center justify-end px-2 text-sm">
            {formatNumberUserReadable(
              Number(BigInt(amount)) / Number(BigInt(10 ** 18)) || 0,
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: () => {
        return (
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            Date
          </div>
        );
      },
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <div className="flex w-full px-2">
              <SkeletonRow
                parentClassName="flex animate-pulse px-2"
                className="h-4 w-20"
              />
            </div>
          );
        }

        const date: string = row.getValue("date");

        return (
          <div className="flex h-10 w-full items-center justify-start whitespace-nowrap px-2 text-sm">
            {date
              ? new Date(Number(date) * 1000).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"}
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <BlankState
          variant="title"
          icon={AlertOctagon}
          title="Failed to load the API definition"
          description="Please check your network connection and refresh the page."
        />
      </div>
    );
  }

  if (!loading && tableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <BlankState
          variant="default"
          icon={Inbox}
          description="No voting power data found for this address"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col gap-2">
        <TheTable
          columns={columns}
          data={loading ? Array(6).fill({}) : tableData}
          withSorting={true}
          withPagination={true}
          filterColumn="address"
          isTableSmall={true}
        />
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPrevious={fetchPreviousPage}
          onNext={fetchNextPage}
          className="text-white"
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          isLoading={fetchingMore}
        />
      </div>
    </div>
  );
};

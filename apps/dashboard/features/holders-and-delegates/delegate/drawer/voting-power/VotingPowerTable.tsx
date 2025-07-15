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
// Strongly-typed GraphQL objects
import type {
  AccountBalance,
  VotingPowerHistory,
} from "@anticapture/graphql-client/hooks";
// We will rely on the types that come with the hook return and avoid direct package imports

export const VotingPowerTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: string;
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"balance" | "timestamp">("balance");

  const {
    delegatorsVotingPowerDetails,
    loading,
    error,
    votingPowerHistoryData,
  } = useVotingPower({
    daoId: daoId as DaoIdEnum,
    address: address,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * ------------------------------------------------------------------
   * Map <delegatorId> -> latest delegation timestamp
   * ------------------------------------------------------------------
   */

  //   const delegatorTimestampMapping = Object.fromEntries(votingPowerHistories.map(vp=>[vp.delegation.delegatorAccountId, vp.delegation.timestamp]))

  // const accountBalancesWithTimestamp = accountBalances.map(ab=>({...ab, timestamp: delegatorTimestampMapping[ab.accountId]}))

  const votingPowerHistories: VotingPowerHistory[] =
    (votingPowerHistoryData as VotingPowerHistory[]) || [];

  const delegatorTimestampMapping: Record<string, string | number | undefined> =
    Object.fromEntries(
      votingPowerHistories.map((vp) => [
        (vp as any).delegatorAccountId?.toLowerCase?.() ?? // TODO: Check the type of this. It's not typed correctly but any is working.
          vp.delegation?.delegatorAccountId?.toLowerCase(),
        (vp as any).timestamp ?? vp.delegation?.timestamp ?? vp.timestamp,
      ]),
    );

  /**
   * ------------------------------------------------------------------
   * Enrich each AccountBalance with its timestamp
   * ------------------------------------------------------------------
   */
  const accountBalances: AccountBalance[] =
    (delegatorsVotingPowerDetails?.accountBalances
      ?.items as AccountBalance[]) || [];

  const accountBalancesWithTimestamp = accountBalances.map((ab) => ({
    ...ab,
    timestamp: delegatorTimestampMapping[ab.accountId.toLowerCase()],
  }));

  /**
   * Shape data for the table component
   */
  const tableData = accountBalancesWithTimestamp.map((ab) => ({
    address: ab.accountId,
    amount: Number(ab.balance) || 0,
    date: ab.timestamp,
  }));

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
            <div className="flex h-10 items-center gap-2">
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
          <div className="text-table-header flex h-8 w-full items-center justify-end px-2">
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
                    : ArrowState.DOWN
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
              Number(BigInt(amount) / BigInt(10 ** 18)) || 0,
            )}
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
          <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
            Date
            <button
              className="!text-table-header cursor-pointer justify-end text-end"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{ className: "ml-2 size-4" }}
                activeState={
                  sortBy === "timestamp" && sortOrder === "asc"
                    ? ArrowState.UP
                    : ArrowState.DOWN
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
              parentClassName="flex animate-pulse"
              className="h-4 w-20"
            />
          );
        }

        const date: string = row.getValue("date");

        return (
          <div className="flex h-10 w-full items-center justify-start px-2 text-sm">
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
      <div className="w-full">
        <TheTable
          columns={columns}
          data={loading ? Array(5).fill({}) : tableData}
          withSorting={true}
          withPagination={true}
          filterColumn="address"
        />
      </div>
      {/* <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      /> */}
    </div>
  );
};

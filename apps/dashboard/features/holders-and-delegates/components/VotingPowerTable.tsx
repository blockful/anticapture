"use client";

import { SkeletonRow, TheTable } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { formatNumberUserReadable } from "@/shared/utils/";
import { BlankState } from "@/shared/components/design-system/blank-state/BlankState";
import { AlertOctagon, Inbox } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { DaoIdEnum } from "@/shared/types/daos";

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
    data: votingPowerData,
    loading,
    error,
    pageInfo,
    fetchMore,
  } = useVotingPower({
    daoId: daoId as DaoIdEnum,
    address: address,
  });

  console.log("votingPowerData = ", votingPowerData);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mapear votingPowerData para o formato da tabela
  const data = (votingPowerData || [])
    .filter((item) => Number(item.balance) > 0)
    .map((item) => ({
      address: item.delegate,
      amount: Number(item.balance),
    }));

  const columns: ColumnDef<{ address: string; amount: number }>[] = [
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
            <span className="truncate text-xs">{addressValue}</span>
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
            {formatNumberUserReadable(amount, 1)}
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

  if (!loading && data.length === 0) {
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
          data={loading ? Array(5).fill({}) : data}
          withSorting={true}
          withPagination={false}
          filterColumn="address"
        />
      </div>
    </div>
  );
};

"use client";

import { QueryInput_AccountBalances_OrderDirection } from "@anticapture/graphql-client";
import { ColumnDef } from "@tanstack/react-table";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { Address } from "viem";

import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { Button, SkeletonRow } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { DateCell } from "@/shared/components/design-system/table/cells/DateCell";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import daoConfig from "@/shared/dao-config";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";

export const VoteCompositionTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: string;
}) => {
  const limit: number = DEFAULT_ITEMS_PER_PAGE;
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [sortBy, setSortBy] = useQueryState(
    "orderBy",
    parseAsStringEnum(["balance", "timestamp"]).withDefault("balance"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "orderDirection",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const {
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  const { balances, loading, error, pagination, fetchNextPage, fetchingMore } =
    useVotingPower({
      daoId: daoId as DaoIdEnum,
      address: address,
      orderBy: sortBy as "balance" | "timestamp",
      orderDirection: sortOrder as QueryInput_AccountBalances_OrderDirection,
      limit,
    });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tableData = balances.map((account) => {
    return {
      address: account.address,
      amount: Number(account.balance) || 0,
      timestamp: account.timestamp,
    };
  });

  const columns: ColumnDef<{
    address: string;
    amount: number;
    timestamp: string;
  }>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          Address
        </div>
      ),
      cell: ({ row }) => {
        if (!isMounted || loading) {
          return (
            <div className="flex w-full items-center gap-3">
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
            <div className="flex items-center opacity-0 transition-opacity [tr:hover_&]:opacity-100">
              <CopyAndPasteButton
                textToCopy={addressValue as `0x${string}`}
                customTooltipText={{
                  default: "Copy address",
                  copied: "Address copied!",
                }}
                className="p-1"
                iconSize="md"
              />
            </div>
          </div>
        );
      },
      meta: {
        columnClassName: "w-72",
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
          <div className="text-table-header flex w-full items-center justify-end whitespace-nowrap">
            Amount ({daoId})
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary justify-end p-0"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{ className: "size-4" }}
                activeState={
                  sortBy === "balance" && sortOrder === "asc"
                    ? ArrowState.UP
                    : sortBy === "balance" && sortOrder === "desc"
                      ? ArrowState.DOWN
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
            <div className="flex w-full items-center justify-end text-sm">
              <SkeletonRow
                parentClassName="flex animate-pulse justify-end"
                className="h-4 w-16"
              />
            </div>
          );
        }
        const amount: number = row.getValue("amount");
        return (
          <div className="flex w-full items-center justify-end text-sm">
            {formatNumberUserReadable(
              token === "ERC20"
                ? Number(BigInt(amount)) / Number(BigInt(10 ** 18)) || 0
                : Number(amount) || 0,
            )}
          </div>
        );
      },
      meta: {
        columnClassName: "w-72",
      },
    },
    {
      accessorKey: "timestamp",
      header: () => {
        return (
          <div className="text-table-header flex w-full items-center justify-start gap-1">
            Date
          </div>
        );
      },
      cell: ({ row }) => {
        const timestamp: string = row.getValue("timestamp");

        if (!isMounted || loading) {
          return (
            <div className="flex w-full">
              <SkeletonRow
                parentClassName="flex animate-pulse"
                className="h-4 w-20"
              />
            </div>
          );
        }

        return (
          <div className="flex w-full items-center justify-start whitespace-nowrap">
            {timestamp ? <DateCell timestampSeconds={timestamp} /> : "N/A"}
          </div>
        );
      },
      meta: {
        columnClassName: "w-72",
      },
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Table
        columns={columns}
        data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData}
        filterColumn="address"
        size="sm"
        hasMore={pagination.hasNextPage}
        isLoadingMore={fetchingMore}
        onLoadMore={fetchNextPage}
        withDownloadCSV={true}
        error={error}
        fillHeight
      />
    </div>
  );
};

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { formatUnits } from "viem";
import type { Address } from "viem";

import { DrawerAddressButton } from "@/features/holders-and-delegates/components/DrawerAddressButton";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { getNextPageParam } from "@anticapture/client";
import type { FormerDelegatorsPathParamsDaoEnumKey } from "@anticapture/client";
import { useFormerDelegatorsInfinite } from "@anticapture/client/hooks";
import { Table } from "@/shared/components/design-system/table/Table";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { formatFullDate } from "@/shared/utils/formatRelativeTime";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";

interface FormerDelegatorRow {
  address: Address;
  vpImpact: number;
  redelegatedAmount: number;
  startTimestamp: string;
  endTimestamp: string;
  redelegatedTo: Address | null;
}

// Addresses that used to delegate to this delegate but have since moved their
// voting power elsewhere (DEV-562 item 9 / #14).
export const FormerDelegatorsTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: DaoIdEnum;
}) => {
  const { decimals } = daoConfigByDaoId[daoId];

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFormerDelegatorsInfinite(
      daoId.toLowerCase() as FormerDelegatorsPathParamsDaoEnumKey,
      address,
      { limit: 20, orderDirection: "desc" },
      { query: { getNextPageParam } },
    );

  const rows: FormerDelegatorRow[] = (data?.pages ?? []).flatMap((page) =>
    page.items.map((item) => ({
      address: item.delegatorAddress as Address,
      vpImpact: Number(formatUnits(BigInt(item.amount.toString()), decimals)),
      redelegatedAmount: Number(
        formatUnits(BigInt(item.redelegatedAmount.toString()), decimals),
      ),
      startTimestamp: item.startTimestamp.toString(),
      endTimestamp: item.endTimestamp.toString(),
      redelegatedTo: (item.redelegatedTo as Address | null) ?? null,
    })),
  );

  const totalCount = data?.pages?.[0]?.totalCount ?? rows.length;
  const totalVpLost = rows.reduce((sum, r) => sum + r.vpImpact, 0);

  const columns: ColumnDef<FormerDelegatorRow>[] = [
    {
      accessorKey: "address",
      header: () => <span className="text-table-header">Address</span>,
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow className="h-5 w-28" />
        ) : (
          <DrawerAddressButton address={row.original.address} />
        ),
      meta: { columnClassName: "w-48" },
    },
    {
      accessorKey: "vpImpact",
      header: () => (
        <span className="text-table-header flex w-full justify-end">
          VP Impact
        </span>
      ),
      cell: ({ row }) =>
        isLoading ? (
          <div className="flex justify-end">
            <SkeletonRow className="h-5 w-16" />
          </div>
        ) : (
          <div className="flex w-full items-center justify-end gap-1.5 text-sm tabular-nums">
            <span className="text-secondary line-through">
              {formatNumberUserReadable(row.original.vpImpact)}
            </span>
            <ArrowRight className="text-secondary size-3.5" />
            <span className="text-error">
              {formatNumberUserReadable(row.original.redelegatedAmount)}
            </span>
          </div>
        ),
      meta: { columnClassName: "w-40" },
    },
    {
      accessorKey: "period",
      header: () => (
        <span className="text-table-header">Delegation Start/End</span>
      ),
      cell: ({ row }) =>
        isLoading ? (
          <SkeletonRow className="h-5 w-32" />
        ) : (
          <div className="text-secondary flex items-center gap-1.5 text-sm">
            <span>{formatFullDate(row.original.startTimestamp)}</span>
            <ArrowRight className="size-3.5" />
            <span>{formatFullDate(row.original.endTimestamp)}</span>
          </div>
        ),
      meta: { columnClassName: "w-56" },
    },
    {
      accessorKey: "redelegatedTo",
      header: () => <span className="text-table-header">Redelegated to</span>,
      cell: ({ row }) => {
        if (isLoading) return <SkeletonRow className="h-5 w-28" />;
        const to = row.original.redelegatedTo;
        return to ? (
          <DrawerAddressButton address={to} />
        ) : (
          <span className="text-secondary text-sm">-</span>
        );
      },
      meta: { columnClassName: "w-48" },
    },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      {!isLoading && rows.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="text-secondary text-alternative-xs font-mono font-medium uppercase">
            Total VP Lost
          </span>
          <span className="text-primary text-md font-normal">
            {formatNumberUserReadable(totalVpLost)} cross {totalCount}{" "}
            {totalCount === 1 ? "address" : "addresses"}
          </span>
        </div>
      )}
      <Table
        columns={columns}
        data={isLoading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : rows}
        size="sm"
        withRowBorders
        hasMore={hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        withDownloadCSV
        csvFilename="former-delegators.csv"
        emptyTitle="No former delegators"
        emptyDescription="No addresses have moved their delegation away from this delegate."
        fillHeight
      />
    </div>
  );
};

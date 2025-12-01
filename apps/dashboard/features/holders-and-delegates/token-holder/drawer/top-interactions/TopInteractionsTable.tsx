"use client";

import { useEffect, useState } from "react";

import { SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { Address } from "viem";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { AlertOctagon, Inbox } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import { formatNumberUserReadable } from "@/shared/utils";
import { Table } from "@/shared/components/design-system/table/Table";
import daoConfig from "@/shared/dao-config";
import { useAccountInteractionsData } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/hooks/useAccountInteractionsData";

export const TopInteractionsTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: string;
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const {
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  const { interactions, loading, error } = useAccountInteractionsData({
    daoId: daoId as DaoIdEnum,
    address: address,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!interactions || interactions.length === 0) {
    return null;
  }

  const tableData = interactions.map((interaction) => {
    return {
      address: interaction?.accountId,
      volume: Number(interaction?.totalVolume) || 0,
      balanceChange: Number(interaction?.amountTransferred) || 0,
      totalInteractions: Number(interaction?.transferCount) || 0,
    };
  });

  const columns: ColumnDef<{
    address: string;
    volume: number;
    balanceChange: number;
    totalInteractions: number;
  }>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          Address
        </div>
      ),
      meta: {
        columnClassName: "w-72",
      },
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
          </div>
        );
      },
    },
    {
      accessorKey: "volume",
      header: () => {
        return (
          <div className="text-table-header flex w-full items-center justify-end whitespace-nowrap">
            Volume ({daoId})
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
        const volume: number = row.getValue("volume");
        return (
          <div className="flex w-full items-center justify-end text-sm">
            {formatNumberUserReadable(
              token === "ERC20"
                ? Number(BigInt(volume)) / Number(BigInt(10 ** 18)) || 0
                : Number(volume) || 0,
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "balanceChange",
      header: () => {
        return (
          <div className="text-table-header flex w-full items-center justify-end whitespace-nowrap">
            Balance Change ({daoId})
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
        const balanceChange: number = row.getValue("balanceChange");
        return (
          <div className="flex w-full items-center justify-end text-sm">
            {formatNumberUserReadable(
              token === "ERC20"
                ? Number(BigInt(balanceChange)) / Number(BigInt(10 ** 18)) || 0
                : Number(balanceChange) || 0,
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalInteractions",
      header: () => {
        return (
          <div className="text-table-header flex w-full items-center justify-end whitespace-nowrap">
            Total Interactions
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
        const totalInteractions: number = row.getValue("totalInteractions");
        return (
          <div className="flex w-full items-center justify-end text-sm">
            {Number(totalInteractions) || 0}
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

  if (!loading && tableData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <BlankSlate
          variant="default"
          icon={Inbox}
          description="No voting power data found for this address"
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Table
        columns={columns}
        data={loading ? Array(12).fill({}) : tableData}
        filterColumn="address"
        size="sm"
        // hasMore={pagination.hasNextPage}
        // isLoadingMore={fetchingMore}
        // onLoadMore={fetchNextPage}
        withDownloadCSV={true}
        wrapperClassName="h-[450px]"
        className="h-[400px]"
      />
    </div>
  );
};

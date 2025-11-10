"use client";

import { Button, IconButton, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Address, parseEther } from "viem";
import { useDelegationHistory } from "@/features/holders-and-delegates/hooks/useDelegationHistory";
import { formatUnits } from "viem";
import {
  formatNumberUserReadable,
  formatDateUserReadable,
} from "@/shared/utils/";
import { BlankSlate } from "@/shared/components/design-system/blank-slate/BlankSlate";
import { AlertOctagon, ExternalLink, Inbox } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { Table } from "@/shared/components/design-system/table/Table";
import daoConfig from "@/shared/dao-config";
import { AmountFilterVariables } from "@/features/holders-and-delegates/hooks/useDelegateDelegationHistory";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { fetchEnsData } from "@/shared/hooks/useEnsData";
import Link from "next/link";

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
  const {
    daoOverview: { token },
  } = daoConfig[daoId];
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortBy, setSortBy] = useState<"timestamp" | "delegatedValue">(
    "timestamp",
  );
  const [filterVariables, setFilterVariables] =
    useState<AmountFilterVariables>();
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [addressFilter, setAddressFilter] = useState<string>();

  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

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
    delegateAccountId: addressFilter,
    orderBy: sortBy,
    orderDirection: sortOrder,
    filterVariables,
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
          ? token === "ERC20"
            ? Number(formatUnits(BigInt(votingPower), 18)).toFixed(2)
            : Number(votingPower).toFixed(2)
          : "0";

      const date = timestamp
        ? formatDateUserReadable(new Date(Number(timestamp) * 1000))
        : "Unknown";

      return {
        address: delegateAddress,
        amount: formattedAmount,
        transactionHash: delegation.transactionHash,
        date,
        timestamp: Number(timestamp),
      };
    }) || [];

  const delegationHistoryColumns: ColumnDef<DelegationData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-4">
          <span>Delegate Address</span>
          <div className="ml-2 w-[180px]">
            <AddressFilter
              onApply={async (addr) => {
                if ((addr ?? "").indexOf(".eth") > 0) {
                  const { address } = await fetchEnsData({
                    address: addr as `${string}.eth`,
                  });
                  setAddressFilter(address || "");
                  return;
                }
                setAddressFilter(addr || "");
              }}
              currentFilter={addressFilter}
            />
          </div>
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
      header: () => (
        <div className="flex items-center justify-end gap-1.5">
          <h4 className="text-table-header">Amount ({daoId})</h4>
          <AmountFilter
            onApply={(filterState: AmountFilterState) => {
              setSortOrder(
                filterState.sortOrder === "largest-first" ? "desc" : "asc",
              );

              setFilterVariables(() => ({
                minDelta: filterState.minAmount
                  ? parseEther(filterState.minAmount).toString()
                  : undefined,
                maxDelta: filterState.maxAmount
                  ? parseEther(filterState.maxAmount).toString()
                  : undefined,
              }));

              setIsFilterActive(
                !!(filterVariables?.minDelta || filterVariables?.maxDelta),
              );
              // Update sort to delegatedValue when filter is applied
              setSortBy("delegatedValue");
            }}
            onReset={() => {
              setIsFilterActive(false);
              // Reset to default sorting
              setSortBy("timestamp");
              setFilterVariables(() => ({
                minDelta: undefined,
                maxDelta: undefined,
              }));
            }}
            isActive={isFilterActive}
            sortOptions={sortOptions}
          />
        </div>
      ),
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
    {
      accessorKey: "transactionHash",
      meta: {
        columnClassName: "w-10",
      },
      cell: ({ row }) => {
        const transactionHash = row.getValue("transactionHash") as string;

        if (loading) {
          return (
            <div className="flex items-center justify-center">
              <SkeletonRow className="h-4 w-4" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center">
            <Link
              href={`${daoConfigByDaoId[daoId].daoOverview.chain.blockExplorers?.default.url}/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary cursor-pointer text-white transition-colors"
              title="View on Tally"
            >
              <IconButton variant="ghost" icon={ExternalLink} />
            </Link>
          </div>
        );
      },
      header: () => <div className="w-full"></div>,
      enableSorting: false,
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

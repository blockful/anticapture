"use client";

import { Button, IconButton, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Address, parseUnits } from "viem";
import { useDelegationHistory } from "@/features/holders-and-delegates/hooks/useDelegationHistory";
import { formatUnits } from "viem";
import { formatNumberUserReadable } from "@/shared/utils/";
import { ExternalLink } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import daoConfigByDaoId from "@/shared/dao-config";
import { DaoIdEnum } from "@/shared/types/daos";
import { Table } from "@/shared/components/design-system/table/Table";
import daoConfig from "@/shared/dao-config";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { fetchAddressFromEnsName } from "@/shared/hooks/useEnsData";
import Link from "next/link";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { useAmountFilterStore } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { DateCell } from "@/shared/components/design-system/table/cells/DateCell";

interface DelegationData {
  address: string;
  amount: string;
  timestamp: string;
}

interface DelegationHistoryTableProps {
  address: string;
  daoId: DaoIdEnum;
}

export const DelegationHistoryTable = ({
  address,
  daoId,
}: DelegationHistoryTableProps) => {
  const limit: number = 20;
  const { decimals } = daoConfig[daoId];
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [sortBy, setSortBy] = useQueryState(
    "orderBy",
    parseAsStringEnum(["timestamp", "amount"]).withDefault("timestamp"),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "orderDirection",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const [filterVariables, setFilterVariables] = useQueryStates({
    fromValue: parseAsString,
    toValue: parseAsString,
  });
  const [isFilterActive, setIsFilterActive] = useQueryState(
    "active",
    parseAsBoolean.withDefault(false),
  );
  const [addressFilter, setAddressFilter] = useQueryState("tabAddress");

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
    delegateAccountId: addressFilter ?? "",
    orderBy: sortBy,
    orderDirection: sortOrder,
    filterVariables,
    limit,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data: DelegationData[] =
    delegationHistory
      ?.filter(
        (delegation): delegation is NonNullable<typeof delegation> =>
          delegation !== null,
      )
      .map((delegation) => {
        const delegateAddress = delegation.delegateAddress || "";
        const delegatedValue = delegation.amount || "0";
        const timestamp = delegation.timestamp || "0";

        const formattedAmount = Number(
          formatUnits(BigInt(delegatedValue), decimals),
        ).toFixed(2);

        return {
          address: delegateAddress,
          amount: formattedAmount,
          transactionHash: delegation.transactionHash,
          timestamp: String(timestamp),
        };
      }) || [];

  const delegationHistoryColumns: ColumnDef<DelegationData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start">
          <span>Delegate Address</span>
          <div className="ml-2 w-[180px]">
            <AddressFilter
              onApply={async (addr) => {
                if ((addr ?? "").indexOf(".eth") > 0) {
                  const address = await fetchAddressFromEnsName({
                    ensName: addr as `${string}.eth`,
                  });
                  setAddressFilter(address);
                  return;
                }
                setAddressFilter(addr || "");
              }}
              currentFilter={addressFilter ?? ""}
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
      header: () => (
        <div className="flex items-center justify-end gap-1.5">
          <h4 className="text-table-header">Amount ({daoId})</h4>
          <AmountFilter
            filterId="delegation-amount-filter"
            onApply={(filterState: AmountFilterState) => {
              if (filterState.sortOrder) {
                setSortOrder(
                  filterState.sortOrder === "largest-first" ? "desc" : "asc",
                );
                setSortBy("amount");
              } else {
                setSortBy("timestamp");
                setSortOrder("desc");
              }

              setFilterVariables(() => ({
                fromValue: filterState.minAmount
                  ? parseUnits(filterState.minAmount, decimals).toString()
                  : "",
                toValue: filterState.maxAmount
                  ? parseUnits(filterState.maxAmount, decimals).toString()
                  : "",
              }));

              setIsFilterActive(
                !!(
                  filterState.minAmount ||
                  filterState.maxAmount ||
                  filterState.sortOrder
                ),
              );
            }}
            onReset={() => {
              setIsFilterActive(false);
              setSortBy("timestamp");
              setFilterVariables(() => ({
                fromValue: "",
                toValue: "",
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
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
          setSortBy("timestamp");
          setSortOrder(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");

          useAmountFilterStore.getState().reset("delegation-amount-filter");
          setIsFilterActive(false);
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

        const timestamp: string = row.getValue("timestamp");

        return (
          <div className="flex w-full items-center justify-start text-sm">
            <DateCell timestampSeconds={timestamp} />
          </div>
        );
      },
      meta: {
        columnClassName: "w-24",
      },
    },
    {
      accessorKey: "transactionHash",
      cell: ({ row }) => {
        const transactionHash = row.getValue("transactionHash") as string;

        if (loading) {
          return (
            <div className="flex items-center justify-center">
              <SkeletonRow className="h-6 w-6" />
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
      meta: {
        columnClassName: "w-12",
      },
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Table
        size="sm"
        columns={delegationHistoryColumns}
        data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : data}
        filterColumn="address"
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

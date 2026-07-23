"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import type { Address } from "viem";
import { parseUnits, zeroAddress } from "viem";

import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { Button } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import type { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import { useGetAddress } from "@anticapture/client/hooks";
import type { DaoIdEnum } from "@/shared/types/daos";
import type { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { formatNumberUserReadable } from "@/shared/utils/formatNumberUserReadable";
import {
  accountBalancesQueryParamsOrderByEnum,
  orderDirectionEnum,
  type AccountBalancesQueryParamsOrderByEnumKey,
  type OrderDirection,
} from "@anticapture/client";
import { parseAsAddress } from "@/shared/utils/parseAsAddress";
import daoConfigByDaoId from "@/shared/dao-config";
import { useMemo } from "react";
import { useDelegatesActivity } from "@/features/holders-and-delegates/hooks/useDelegatesActivity";
import { InactiveDelegatesBanner } from "@/features/holders-and-delegates/components/InactiveDelegatesBanner";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { cn } from "@/shared/utils/cn";

const AMOUNT_SORT_OPTIONS = [
  { value: "largest-first", label: "Largest first" },
  { value: "smallest-first", label: "Smallest first" },
];

interface TokenHolderTableData {
  address: Address;
  balance: number;
  variation: { percentageChange: number; absoluteChange: number } | null;
  delegate: Address;
}

const TypeCell = ({ address }: { address: Address }) => {
  const { data, isLoading: isArkhamLoading } = useGetAddress(address ?? "0x", {
    query: { enabled: !!address },
  });
  const isContract = data?.isContract ?? null;

  if (isArkhamLoading) {
    return (
      <SkeletonRow
        parentClassName="flex animate-pulse"
        className="h-5 w-16 rounded-full"
      />
    );
  }

  return (
    <BadgeStatus variant="secondary">
      {isContract ? "Contract" : "EOA"}
    </BadgeStatus>
  );
};

export const TokenHolders = ({
  days,
  fromDate,
  toDate,
  daoId,
  showTokenName = true,
}: {
  days?: TimeInterval;
  fromDate?: number;
  toDate?: number;
  daoId: DaoIdEnum;
  showTokenName?: boolean;
}) => {
  const [drawerAddress, setDrawerAddress] = useQueryState(
    "drawerAddress",
    parseAsAddress,
  );
  const [currentAddressFilter, setCurrentAddressFilter] =
    useQueryState("address");
  const [orderDirection, setOrderDirection] = useQueryState(
    "sort",
    parseAsStringEnum<OrderDirection>(
      Object.values(orderDirectionEnum),
    ).withDefault("desc"),
  );
  const [orderBy, setOrderBy] = useQueryState(
    "sortBy",
    parseAsStringEnum<AccountBalancesQueryParamsOrderByEnumKey>(
      Object.values(accountBalancesQueryParamsOrderByEnum),
    ).withDefault("balance"),
  );
  const [minValue, setMinValue] = useQueryState("minValue");
  const [maxValue, setMaxValue] = useQueryState("maxValue");
  const { decimals } = daoConfigByDaoId[daoId];

  const { isMobile } = useScreenSize();

  // API expects raw token units; URL values are human-readable and user-editable
  const toRawUnits = (value: string | null): string | undefined => {
    if (!value) return undefined;
    try {
      return parseUnits(value, decimals).toString();
    } catch {
      return undefined;
    }
  };

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || null);
  };

  // Cycles: no-arrow (balance desc) → down-arrow (signed variation desc) → up-arrow (signed variation asc) → both-arrows (variation desc) → no-arrow
  const handleVariationSort = () => {
    if (orderBy === "signedVariation" && orderDirection === "desc") {
      setOrderDirection("asc");
    } else if (orderBy === "signedVariation" && orderDirection === "asc") {
      setOrderBy("variation");
      setOrderDirection("desc");
    } else if (orderBy === "variation") {
      setOrderBy("balance");
      setOrderDirection("desc");
    } else {
      setOrderBy("signedVariation");
      setOrderDirection("desc");
    }
  };

  const {
    data: tableData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useTokenHolders(daoId, {
    limit: 20,
    orderBy,
    orderDirection,
    addresses: currentAddressFilter ? [currentAddressFilter] : undefined,
    fromDay: days,
    fromDate,
    toDate,
    fromValue: toRawUnits(minValue),
    toValue: toRawUnits(maxValue),
  });

  const rows = isLoading
    ? Array(DEFAULT_ITEMS_PER_PAGE).fill({} as TokenHolderTableData)
    : (tableData ?? []);

  const activityFromDate =
    fromDate ??
    (days ? Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[days] : undefined);

  const delegateAddresses = useMemo(
    () =>
      (tableData ?? [])
        .map((row) => row.delegate)
        .filter((delegate) => delegate && delegate !== zeroAddress),
    [tableData],
  );

  const { activityFor, isActivityLoadingFor } = useDelegatesActivity({
    daoId,
    addresses: delegateAddresses,
    fromDate: activityFromDate,
  });

  const tokenHoldersColumns: ColumnDef<TokenHolderTableData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter || undefined}
          />
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
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
          <div className="group flex w-full items-center">
            <div className="min-w-0 flex-1">
              <EnsAvatar
                address={addressValue as Address}
                size="sm"
                variant="rounded"
                isDashed={true}
                nameClassName="[tr:hover_&]:border-primary"
              />
            </div>
            {!isMobile && (
              <div className="flex items-center opacity-0 transition-opacity [tr:hover_&]:opacity-100">
                <CopyAndPasteButton
                  textToCopy={addressValue as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="mx-1 p-1"
                  iconSize="md"
                />
                <Button
                  data-ph-event="holder_details"
                  data-ph-source="holders_table"
                  data-umami-event="holder_details"
                  variant="outline"
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  <span className="text-sm font-medium">Details</span>
                </Button>
              </div>
            )}
          </div>
        );
      },
      meta: {
        columnClassName: "w-68",
      },
    },
    {
      accessorKey: "type",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          <span>Type</span>
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse"
              className="h-5 w-16 rounded-full"
            />
          );
        }
        return <TypeCell address={row.original.address} />;
      },
      meta: {
        columnClassName: "w-12",
      },
    },
    {
      accessorKey: "balance",
      header: () => (
        <div className="flex w-full items-center justify-end gap-1.5">
          <h4 className="text-table-header whitespace-nowrap">
            Balance {!!showTokenName && `(${daoId})`}
          </h4>
          <AmountFilter
            filterId="token-holders-balance-filter"
            sortOptions={AMOUNT_SORT_OPTIONS}
            onApply={(filterState: AmountFilterState) => {
              if (filterState.sortOrder) {
                setOrderBy("balance");
                setOrderDirection(
                  filterState.sortOrder === "largest-first" ? "desc" : "asc",
                );
              }
              setMinValue(filterState.minAmount || null);
              setMaxValue(filterState.maxAmount || null);
            }}
            onReset={() => {
              setMinValue(null);
              setMaxValue(null);
              setOrderBy("balance");
              setOrderDirection("desc");
            }}
            isActive={!!(minValue || maxValue)}
          />
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <div className="flex w-full items-center justify-end">
              <SkeletonRow className="h-4 w-20" />
            </div>
          );
        }

        const balance: number = row.getValue("balance");
        return (
          <div className="flex w-full items-center justify-end text-sm font-normal">
            {formatNumberUserReadable(balance, 1)}
          </div>
        );
      },
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "variation",
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-center p-0"
          onClick={handleVariationSort}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Change ({daoId})
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              orderBy === "signedVariation"
                ? orderDirection === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.UP
                : orderBy === "variation"
                  ? ArrowState.BOTH
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      cell: ({ row }) => {
        const variation = row.getValue("variation") as
          | {
              percentageChange: number;
              absoluteChange: number;
            }
          | undefined;

        if (isLoading) {
          return (
            <div className="flex w-full items-center justify-center">
              <SkeletonRow
                className="h-4 w-16"
                parentClassName="flex animate-pulse"
              />
            </div>
          );
        }

        return (
          <div className="flex w-full flex-col items-center justify-center overflow-hidden text-sm">
            <span className="min-w-0 tabular-nums">
              {(variation?.percentageChange || 0) < 0 ? "-" : ""}
              {formatNumberUserReadable(
                Math.abs(variation?.absoluteChange || 0),
              )}
            </span>
            <Percentage
              className="min-w-0 text-xs"
              iconPosition="right"
              value={variation?.percentageChange || 0}
            />
          </div>
        );
      },
      meta: {
        columnClassName: "w-50",
      },
    },
    {
      accessorKey: "delegate",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          Delegate
        </div>
      ),
      cell: ({ row }) => {
        if (isLoading) {
          return (
            <div className="flex items-center gap-1.5">
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

        const delegate: string = row.getValue("delegate");

        if (delegate === zeroAddress) {
          return (
            <div className="flex items-center">
              <BadgeStatus variant={"error"}>{"Not delegated"}</BadgeStatus>
            </div>
          );
        }

        const activity = activityFor(delegate);
        const isInactive =
          activity &&
          activity.totalProposals > 0 &&
          activity.votedProposals === 0;

        return (
          <div className="flex flex-col justify-center gap-0.5">
            <EnsAvatar
              address={delegate as Address}
              size="sm"
              variant="rounded"
            />
            {isActivityLoadingFor(delegate) ? (
              <SkeletonRow
                parentClassName="flex animate-pulse pl-8"
                className="h-3 w-16"
              />
            ) : (
              activity &&
              activity.totalProposals > 0 && (
                <span
                  className={cn(
                    "pl-8 text-xs font-normal",
                    isInactive ? "text-warning" : "text-secondary",
                  )}
                >
                  Voted {activity.votedProposals}/{activity.totalProposals}
                  {isInactive ? " (Inactive)" : ""}
                </span>
              )
            )}
          </div>
        );
      },
      meta: {
        columnClassName: "w-40",
      },
    },
  ];

  return (
    <>
      <div className="min-h-75 flex h-[calc(100vh-16rem)] w-full flex-col gap-3 text-white">
        <InactiveDelegatesBanner
          daoId={daoId}
          fromDate={activityFromDate}
          toDate={toDate}
        />
        <Table
          columns={tokenHoldersColumns}
          data={rows}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onRowClick={(row) => setDrawerAddress(row.address)}
          withRowBorders
          withDownloadCSV={true}
          csvFilename="token-holders.csv"
          error={error}
          fillHeight
        />
      </div>
      <HoldersAndDelegatesDrawer
        isOpen={!!drawerAddress}
        onClose={() => setDrawerAddress(null)}
        entityType="tokenHolder"
        address={drawerAddress || ""}
        daoId={daoId}
      />
    </>
  );
};

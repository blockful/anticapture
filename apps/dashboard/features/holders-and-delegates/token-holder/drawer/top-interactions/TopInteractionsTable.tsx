"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { formatUnits, parseUnits } from "viem";
import { useToken } from "@anticapture/client/hooks";
import type { TokenPathParamsDaoEnumKey } from "@anticapture/client";

import { useAccountInteractionsData } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/hooks/useAccountInteractionsData";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { Button, SkeletonRow } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { DrawerAddressButton } from "@/features/holders-and-delegates/components/DrawerAddressButton";
import { AddressFilter } from "@/shared/components/design-system/table/filters";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import type { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import type { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { useAmountFilterStore } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { BadgeStatus } from "@/shared/components/design-system/badges";
import { Switch } from "@/shared/components/design-system/switch/Switch";
import { percentageVariants } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import daoConfig from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";
import { cn, formatNumberUserReadable } from "@/shared/utils";

export const TopInteractionsTable = ({
  address,
  daoId,
}: {
  address: string;
  daoId: string;
}) => {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentAddressFilter, setCurrentAddressFilter] =
    useQueryState("tabAddress");

  const [sortBy, setSortBy] = useQueryState(
    "orderBy",
    parseAsStringEnum(["count", "volume"]).withDefault("count"),
  );
  const [sortDirection, setSortDirection] = useQueryState(
    "orderDirection",
    parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  );
  const [filterVariables, setFilterVariables] = useQueryStates({
    minAmount: parseAsString,
    maxAmount: parseAsString,
  });
  const [isFilterActive, setIsFilterActive] = useQueryState(
    "active",
    parseAsBoolean.withDefault(false),
  );
  // dust interactions (< $1 of volume) are hidden by default
  const [hideDust, setHideDust] = useQueryState(
    "hideDust",
    parseAsBoolean.withDefault(true),
  );

  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

  const {
    decimals,
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  const { data: tokenData } = useToken(
    daoId.toLowerCase() as TokenPathParamsDaoEnumKey,
    { currency: "usd" },
  );

  // raw token units worth $1 at the current spot price; interactions whose
  // total volume is below this are flagged (and hidden) as dust
  const dustThresholdRawUnits = useMemo(() => {
    const priceUsd = Number(tokenData?.price) || 0;
    if (priceUsd <= 0) return 0n;
    return BigInt(Math.floor(Number(parseUnits("1", decimals)) / priceUsd));
  }, [tokenData?.price, decimals]);

  // "Hide dust" is enforced by the query, not client-side: filtering a page
  // after the fact can empty it out, and an empty table renders its empty state
  // without the infinite-scroll sentinel, stranding the later pages.
  const minAmount = useMemo(() => {
    const userMin = filterVariables.minAmount
      ? BigInt(filterVariables.minAmount)
      : 0n;
    // `minAmount` is exclusive server-side, so one below the threshold keeps
    // rows worth exactly $1, matching `isDust`.
    const dustMin =
      hideDust && dustThresholdRawUnits > 0n ? dustThresholdRawUnits - 1n : 0n;
    const effective = userMin > dustMin ? userMin : dustMin;
    return effective > 0n ? effective.toString() : null;
  }, [filterVariables.minAmount, hideDust, dustThresholdRawUnits]);

  const {
    interactions,
    loading,
    error,
    fetchNextPage,
    fetchingMore,
    hasNextPage,
  } = useAccountInteractionsData({
    daoId: daoId as DaoIdEnum,
    address: address,
    filterAddress: currentAddressFilter ?? undefined,
    sortBy,
    sortDirection,
    filterVariables: { minAmount, maxAmount: filterVariables.maxAmount },
    limit: 10,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDust = (volume: number) =>
    dustThresholdRawUnits > 0n && volume < Number(dustThresholdRawUnits);

  // The copy has to name the filter that emptied the page, or an address whose
  // every interaction is under $1 reads as one that never interacted at all.
  const emptyState: { emptyTitle?: string; emptyDescription?: string } =
    currentAddressFilter || isFilterActive
      ? {
          emptyTitle: "No interactions match these filters",
          emptyDescription:
            "Clear the address or value filter to see more interactions.",
        }
      : hideDust
        ? {
            emptyTitle: "Only dust interactions",
            emptyDescription:
              'Every interaction with this address is worth less than $1. Turn off "Hide dust" to see them.',
          }
        : {};

  const tableData = (interactions ?? []).map((interaction) => {
    return {
      address: interaction?.accountId,
      volume: Number(interaction?.totalVolume) || 0,
      balanceChange: Number(interaction?.amountTransferred) || 0,
      totalInteractions: Number(interaction?.transferCount) || 0,
    };
  });

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || null);
  };

  const columns: ColumnDef<{
    address: string;
    volume: number;
    balanceChange: number;
    totalInteractions: number;
  }>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter ?? ""}
          />
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
            <DrawerAddressButton
              address={addressValue as Address}
              entityType="tokenHolder"
            />
            {isDust(row.original.volume) && (
              <BadgeStatus variant="dimmed">Dust</BadgeStatus>
            )}
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
        columnClassName: "w-60",
      },
    },
    {
      accessorKey: "volume",
      header: () => {
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Tooltip tooltipContent="Total amount transferred between the two addresses, counting both incoming and outgoing transactions.">
              <h4 className="text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap text-right underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
                Volume ({daoId})
              </h4>
            </Tooltip>
            <AmountFilter
              filterId="top-interactions-amount-filter"
              onApply={(filterState: AmountFilterState) => {
                if (filterState.sortOrder) {
                  setSortDirection(
                    filterState.sortOrder === "largest-first" ? "desc" : "asc",
                  );
                  setSortBy("volume");
                } else {
                  setSortBy("count");
                  setSortDirection("desc");
                }

                setFilterVariables(() => ({
                  minAmount: filterState.minAmount
                    ? parseUnits(filterState.minAmount, decimals).toString()
                    : null,
                  maxAmount: filterState.maxAmount
                    ? parseUnits(filterState.maxAmount, decimals).toString()
                    : null,
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
                setSortBy("count");
                setFilterVariables(() => ({
                  minAmount: null,
                  maxAmount: null,
                }));
              }}
              isActive={isFilterActive}
              sortOptions={sortOptions}
            />
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
        const volume: number = row.getValue("volume");
        return (
          <div className="flex w-full items-center justify-end text-sm">
            {formatNumberUserReadable(
              token === "ERC20"
                ? Number(BigInt(volume)) / Number(BigInt(10 ** decimals)) || 0
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
          <div className="flex w-full items-center justify-end gap-1.5 whitespace-nowrap">
            <Tooltip tooltipContent="Net change in the holder’s balance from these interactions: incoming minus outgoing.">
              <h4 className="text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap text-right underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
                Balance Change ({daoId})
              </h4>
            </Tooltip>
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
        const balanceChange: number = row.getValue("balanceChange");

        const value = Number(formatUnits(BigInt(balanceChange), decimals));

        // this is inverted because is relative to the drawer address
        // thus a positive value on the row means the drawer address is sending tokens
        const variant = value < 0 ? "positive" : "negative";

        if (value === 0) {
          return (
            <span
              className={cn(
                "flex w-full items-center justify-end text-sm",
                percentageVariants({ variant: "neutral" }),
              )}
            >
              0
            </span>
          );
        }

        return (
          <span
            className={cn(
              "flex w-full items-center justify-end text-sm",
              percentageVariants({ variant }),
            )}
          >
            {value < 0 ? (
              // this is inverted because is relative to the drawer address
              // thus a positive value on the row means the drawer address is sending tokens
              <ArrowUp
                className={cn(
                  "size-4",
                  variant === "positive" && "text-success",
                )}
              />
            ) : (
              <ArrowDown
                className={cn("size-4", variant === "negative" && "text-error")}
              />
            )}
            {formatNumberUserReadable(Math.abs(value))}
          </span>
        );
      },
    },
    {
      accessorKey: "totalInteractions",
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = sortDirection === "desc" ? "asc" : "desc";
          setSortDirection(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");

          useAmountFilterStore
            .getState()
            .reset("top-interactions-amount-filter");
          setIsFilterActive(false);
        };

        return (
          <div className="flex w-full items-center justify-end gap-1.5 whitespace-nowrap">
            <Tooltip tooltipContent="Value of everything transferred between the two addresses, at the current token price. Sorting is by how many transactions they had with the holder.">
              <h4 className="text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap text-right underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
                Total Interactions
              </h4>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              className="text-secondary justify-end p-0"
              onClick={handleSortToggle}
            >
              <ArrowUpDown
                props={{
                  className: "size-4",
                }}
                activeState={
                  sortDirection === "asc"
                    ? ArrowState.UP
                    : sortDirection === "desc"
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
        const priceUsd = Number(tokenData?.price) || 0;
        // The price comes from its own query, so show nothing until there is a
        // real one: defaulting to 0 renders a confident "$0" on every row.
        if (priceUsd <= 0) {
          return (
            <div className="text-secondary flex w-full items-center justify-end text-sm">
              -
            </div>
          );
        }
        const volumeTokens =
          token === "ERC20"
            ? Number(row.original.volume) / 10 ** decimals
            : Number(row.original.volume);
        const usdValue = volumeTokens * priceUsd;
        return (
          <div className="flex w-full items-center justify-end text-sm">
            ${formatNumberUserReadable(usdValue)}
          </div>
        );
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
        withDownloadCSV={true}
        csvFilename="top-interactions.csv"
        error={error}
        {...emptyState}
        hasMore={hasNextPage}
        isLoadingMore={fetchingMore}
        onLoadMore={fetchNextPage}
        footerActions={
          <Switch
            checked={hideDust}
            onCheckedChange={setHideDust}
            label="Hide dust"
          />
        }
        fillHeight
      />
    </div>
  );
};

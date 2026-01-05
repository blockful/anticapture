"use client";

import { useEffect, useState } from "react";

import { Button, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ColumnDef } from "@tanstack/react-table";
import { Address, formatUnits, parseUnits } from "viem";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DaoIdEnum } from "@/shared/types/daos";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { Table } from "@/shared/components/design-system/table/Table";
import daoConfig from "@/shared/dao-config";
import { useAccountInteractionsData } from "@/features/holders-and-delegates/token-holder/drawer/top-interactions/hooks/useAccountInteractionsData";
import { AddressFilter } from "@/shared/components/design-system/table/filters";
import { percentageVariants } from "@/shared/components/design-system/table/Percentage";
import { AmountFilter } from "@/shared/components/design-system/table/filters/amount-filter/AmountFilter";
import { AmountFilterState } from "@/shared/components/design-system/table/filters/amount-filter/store/amount-filter-store";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { SortOption } from "@/shared/components/design-system/table/filters/amount-filter/components";
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";

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
    parseAsStringEnum(["transferCount", "totalVolume"]).withDefault(
      "transferCount",
    ),
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

  const sortOptions: SortOption[] = [
    { value: "largest-first", label: "Largest first" },
    { value: "smallest-first", label: "Smallest first" },
  ];

  const {
    decimals,
    daoOverview: { token },
  } = daoConfig[daoId as DaoIdEnum];

  const { interactions, loading, error, totalTransfers } =
    useAccountInteractionsData({
      daoId: daoId as DaoIdEnum,
      address: address,
      accountId: currentAddressFilter ?? undefined,
      sortBy,
      sortDirection,
      filterVariables,
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

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
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
        <div className="text-table-header flex w-full items-center justify-start">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter ?? undefined}
            className="ml-2"
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
              filterId="top-interactions-volume-filter"
              onApply={(filterState: AmountFilterState) => {
                setSortDirection(
                  filterState.sortOrder === "largest-first" ? "desc" : "asc",
                );

                setFilterVariables(() => ({
                  minAmount: filterState.minAmount
                    ? parseUnits(filterState.minAmount, decimals).toString()
                    : undefined,
                  maxAmount: filterState.maxAmount
                    ? parseUnits(filterState.maxAmount, decimals).toString()
                    : undefined,
                }));

                setIsFilterActive(
                  !!(filterVariables?.minAmount || filterVariables?.maxAmount),
                );

                setSortBy("totalVolume");
              }}
              onReset={() => {
                setIsFilterActive(false);
                // Reset to default sorting
                setSortBy("transferCount");
                setFilterVariables(() => ({
                  minAmount: undefined,
                  maxAmount: undefined,
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
        };

        return (
          <div className="flex w-full items-center justify-end gap-1.5 whitespace-nowrap">
            <Tooltip tooltipContent="Addresses ranked by how many transactions they had with the holder (interaction count).">
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
        const totalInteractions: number = row.getValue("totalInteractions");
        return (
          <div className="flex w-full items-center justify-end text-sm">
            {Number(totalInteractions) || 0} (
            {((totalInteractions / totalTransfers) * 100).toFixed(2)}%)
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex w-full flex-col gap-2">
      <Table
        columns={columns}
        data={loading ? Array(12).fill({}) : tableData}
        filterColumn="address"
        size="sm"
        withDownloadCSV={true}
        wrapperClassName="h-[450px]"
        className="h-[400px]"
        error={error}
      />
    </div>
  );
};

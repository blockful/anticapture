"use client";

import { useMemo } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { formatNumberUserReadable } from "@/shared/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Address, formatUnits, zeroAddress } from "viem";
import { Plus } from "lucide-react";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { QueryInput_AccountBalances_OrderDirection } from "@anticapture/graphql-client";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { useScreenSize } from "@/shared/hooks";
import { Table } from "@/shared/components/design-system/table/Table";
import { Button } from "@/shared/components";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import daoConfig from "@/shared/dao-config";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";

interface TokenHolderTableData {
  address: Address;
  type: string | undefined;
  balance: number;
  variation: { percentageChange: number; absoluteChange: number } | null;
  delegate: Address;
}

export const TokenHolders = ({
  days,
  daoId,
}: {
  days: TimeInterval;
  daoId: DaoIdEnum;
}) => {
  const [drawerAddress, setDrawerAddress] = useQueryState("drawerAddress");
  const [currentAddressFilter, setCurrentAddressFilter] =
    useQueryState("address");
  const [sortOrder, setSortOrder] = useQueryState(
    "sort",
    parseAsStringEnum(["desc", "asc"]).withDefault("desc"),
  );
  const pageLimit: number = 15;
  const { isMobile } = useScreenSize();
  const { decimals } = daoConfig[daoId];

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || null);
  };

  const {
    data: tokenHoldersData,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchingMore,
    isHistoricalLoadingFor,
    historicalBalancesCache,
  } = useTokenHolders({
    daoId: daoId,
    limit: pageLimit,
    orderDirection: sortOrder as QueryInput_AccountBalances_OrderDirection,
    address: currentAddressFilter,
    days: days,
  });

  const tableData: TokenHolderTableData[] = useMemo(() => {
    const calculateVariation = (
      currentBalance: string,
      historicalBalance: string | undefined,
    ): { percentageChange: number; absoluteChange: number } | null => {
      if (!historicalBalance) return null;

      try {
        const current = Number(formatUnits(BigInt(currentBalance), decimals));
        const historical = Number(
          formatUnits(BigInt(historicalBalance), decimals),
        );

        const absoluteChange = current - historical;

        if (historical === 0) {
          return {
            percentageChange: 9999,
            absoluteChange: Number(absoluteChange.toFixed(2)),
          };
        }

        const percentageChange = ((current - historical) / historical) * 100;

        return {
          percentageChange: Number(percentageChange.toFixed(2)),
          absoluteChange: Number(absoluteChange.toFixed(2)),
        };
      } catch (error) {
        console.error("Error calculating variation:", error);
        return { percentageChange: 0, absoluteChange: 0 };
      }
    };
    return (
      tokenHoldersData?.map((holder) => {
        const historicalBalance = historicalBalancesCache.get(holder.accountId);
        const variation = calculateVariation(holder.balance, historicalBalance);

        return {
          address: holder.accountId as Address,
          type: holder.account?.type,
          balance: Number(formatUnits(BigInt(holder.balance), decimals)),
          variation,
          delegate: holder.delegate as Address,
        };
      }) || []
    );
  }, [tokenHoldersData, historicalBalancesCache, decimals]);

  const tokenHoldersColumns: ColumnDef<TokenHolderTableData>[] = [
    {
      accessorKey: "address",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter || undefined}
            className="ml-2"
          />
        </div>
      ),
      cell: ({ row }) => {
        if (loading) {
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
            <EnsAvatar
              address={addressValue as Address}
              size="sm"
              variant="rounded"
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
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
        columnClassName: "w-72",
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => {
        const handleSortToggle = () => {
          const newSortOrder = sortOrder === "desc" ? "asc" : "desc";
          setSortOrder(newSortOrder);
          column.toggleSorting(newSortOrder === "desc");
        };

        return (
          <div className="text-table-header flex w-full items-center justify-end whitespace-nowrap">
            Balance ({daoId})
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
                  sortOrder === "asc"
                    ? ArrowState.UP
                    : sortOrder === "desc"
                      ? ArrowState.DOWN
                      : ArrowState.DEFAULT
                }
              />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        if (loading) {
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
        columnClassName: "w-20",
      },
    },
    {
      accessorKey: "variation",
      header: () => (
        <div className="text-table-header flex w-full items-center justify-center">
          Change ({daoId})
        </div>
      ),
      cell: ({ row }) => {
        const addr = row.original.address;

        const variation = row.getValue("variation") as
          | {
              percentageChange: number;
              absoluteChange: number;
            }
          | undefined;

        if (isHistoricalLoadingFor(addr) || loading) {
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
          <div className="flex w-full items-center justify-center gap-2 text-sm">
            {(variation?.percentageChange || 0) < 0 ? "-" : ""}
            {formatNumberUserReadable(Math.abs(variation?.absoluteChange || 0))}
            <Percentage value={variation?.percentageChange || 0} />
          </div>
        );
      },
      meta: {
        columnClassName: "w-80",
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
        if (loading) {
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

        return (
          <div className="flex items-center gap-1.5">
            {delegate === zeroAddress ? (
              <div className="flex items-center">
                <BadgeStatus variant={"error"}>{"Not delegated"}</BadgeStatus>
              </div>
            ) : (
              <EnsAvatar
                address={delegate as Address}
                size="sm"
                variant="rounded"
              />
            )}
          </div>
        );
      },
      meta: {
        columnClassName: "w-80",
      },
    },
  ];

  return (
    <>
      <div className="w-full text-white">
        <div className="flex flex-col gap-2">
          <Table
            columns={tokenHoldersColumns}
            data={loading ? Array(12).fill({}) : tableData}
            hasMore={pagination.hasNextPage}
            isLoadingMore={fetchingMore}
            onLoadMore={fetchNextPage}
            onRowClick={(row) => setDrawerAddress(row.address as Address)}
            size="sm"
            withDownloadCSV={true}
            wrapperClassName="h-[450px]"
            className="h-[400px]"
            error={error}
          />
        </div>
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

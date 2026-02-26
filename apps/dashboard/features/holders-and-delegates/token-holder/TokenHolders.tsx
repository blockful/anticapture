"use client";

import {
  QueryInput_AccountBalances_OrderBy,
  QueryInput_AccountBalances_OrderDirection,
} from "@anticapture/graphql-client";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { Address, formatUnits, zeroAddress } from "viem";

import { HoldersAndDelegatesDrawer } from "@/features/holders-and-delegates";
import { useTokenHolders } from "@/features/holders-and-delegates/hooks/useTokenHolders";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { Button } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons/ArrowUpDown";
import { SkeletonRow } from "@/shared/components/skeletons/SkeletonRow";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import daoConfig from "@/shared/dao-config";
import { useScreenSize } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums/TimeInterval";
import { formatNumberUserReadable } from "@/shared/utils";

interface TokenHolderTableData {
  address: Address;
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
  const pageLimit: number = 20;
  const [drawerAddress, setDrawerAddress] = useQueryState("drawerAddress");
  const [currentAddressFilter, setCurrentAddressFilter] =
    useQueryState("address");
  const [sortOrder, setSortOrder] = useQueryState(
    "sort",
    parseAsStringEnum(["desc", "asc"]).withDefault("desc"),
  );
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsStringEnum(["balance", "variation"]).withDefault("balance"),
  );
  const { isMobile } = useScreenSize();
  const { decimals } = daoConfig[daoId];

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || null);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field as "balance" | "variation");
      setSortOrder("desc");
    }
  };

  const {
    data: tokenHoldersData,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchingMore,
  } = useTokenHolders({
    daoId: daoId,
    limit: pageLimit,
    orderBy: sortBy as QueryInput_AccountBalances_OrderBy,
    orderDirection: sortOrder as QueryInput_AccountBalances_OrderDirection,
    address: currentAddressFilter || undefined,
    days: days,
  });

  const tableData: TokenHolderTableData[] = useMemo(() => {
    return (
      tokenHoldersData?.map((holder) => {
        const variation = holder.variation
          ? {
              percentageChange:
                holder.variation.percentageChange === PERCENTAGE_NO_BASELINE
                  ? 9999
                  : Number(
                      Number(holder.variation.percentageChange).toFixed(2),
                    ),
              absoluteChange: Number(
                formatUnits(BigInt(holder.variation.absoluteChange), decimals),
              ),
            }
          : null;
        return {
          address: holder.accountId as Address,
          balance: Number(formatUnits(BigInt(holder.balance), decimals)),
          variation,
          delegate: holder.delegate as Address,
        };
      }) || []
    );
  }, [tokenHoldersData, decimals]);

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
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => handleSort("balance")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Balance ({daoId})
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "balance"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
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
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-center p-0"
          onClick={() => handleSort("variation")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Change ({daoId})
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "variation"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
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

        if (loading) {
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
      <div className="min-h-75 flex h-[calc(100vh-16rem)] w-full flex-col text-white">
        <Table
          columns={tokenHoldersColumns}
          data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData}
          hasMore={pagination.hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          onRowClick={(row) => setDrawerAddress(row.address as Address)}
          size="sm"
          withDownloadCSV={true}
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

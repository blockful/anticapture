"use client";

import {
  QueryInput_VotingPowers_OrderBy,
  QueryInput_VotingPowers_OrderDirection,
} from "@anticapture/graphql-client";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";
import { Address, formatUnits } from "viem";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import { DEFAULT_ITEMS_PER_PAGE } from "@/features/holders-and-delegates/utils";
import { SkeletonRow, Button } from "@/shared/components";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Table } from "@/shared/components/design-system/table/Table";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
import { useScreenSize } from "@/shared/hooks";
import { DaoIdEnum } from "@/shared/types/daos";
import { TimeInterval } from "@/shared/types/enums";
import { formatNumberUserReadable } from "@/shared/utils";
import { Footer } from "@/shared/components/design-system/footer";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";

interface DelegateTableData {
  address: string;
  votingPower: string;
  variation?: {
    percentageChange: number;
    absoluteChange: number;
  };
  delegators: number;
}

export default function AavePage() {
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
    parseAsStringEnum([
      "delegationsCount",
      "votingPower",
      "variation",
    ]).withDefault("votingPower"),
  );
  const daoId = DaoIdEnum.AAVE;
  const decimals = 18;

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
  };

  const { data, loading, error, pagination, fetchNextPage, fetchingMore } =
    useDelegates({
      orderBy: sortBy as QueryInput_VotingPowers_OrderBy,
      orderDirection: sortOrder as QueryInput_VotingPowers_OrderDirection,
      daoId,
      days: TimeInterval.THIRTY_DAYS,
      address: currentAddressFilter || undefined,
      limit: pageLimit,
      skipActivity: true,
    });

  const { isMobile } = useScreenSize();

  // Handle sorting for voting power and delegators
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc for votingPower, asc for delegationsCount
      setSortBy(field as "votingPower" | "delegationsCount" | "variation");
      setSortOrder(field === "delegationsCount" ? "asc" : "desc");
    }
  };

  const tableData = useMemo(() => {
    if (!data) return [];

    return data.map((delegate): DelegateTableData => {
      const votingPowerBigInt = BigInt(delegate.votingPower || "0");
      const votingPowerFormatted = Number(
        formatUnits(votingPowerBigInt, decimals),
      );

      return {
        address: delegate.accountId,
        votingPower: formatNumberUserReadable(votingPowerFormatted),
        variation: {
          percentageChange:
            delegate.variation.percentageChange === PERCENTAGE_NO_BASELINE
              ? 9999
              : Number(Number(delegate.variation.percentageChange).toFixed(2)),
          absoluteChange: Number(
            formatUnits(BigInt(delegate.variation.absoluteChange), decimals),
          ),
        },
        delegators: delegate.delegationsCount,
      };
    });
  }, [data, decimals]);

  const delegateColumns: ColumnDef<DelegateTableData>[] = [
    {
      accessorKey: "address",
      cell: ({ row }) => {
        const address = row.getValue("address") as string;
        if (loading) {
          return (
            <div className="flex items-center gap-3">
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

        return (
          <div className="group flex w-full items-center">
            <EnsAvatar
              address={address as Address}
              size="sm"
              variant="rounded"
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
            {!isMobile && (
              <div className="flex items-center opacity-0 transition-opacity [tr:hover_&]:opacity-100">
                <CopyAndPasteButton
                  textToCopy={address as `0x${string}`}
                  customTooltipText={{
                    default: "Copy address",
                    copied: "Address copied!",
                  }}
                  className="mx-1 p-1"
                  iconSize="md"
                />
                <Button
                  data-ph-event="delegate_details"
                  data-ph-source="delegates_table"
                  data-umami-event="delegate_details"
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
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start gap-2">
          <span>Address</span>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter || undefined}
          />
        </div>
      ),
      meta: {
        columnClassName: "w-72",
      },
    },
    {
      accessorKey: "votingPower",
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse w-full items-center justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="text-secondary flex w-full items-center justify-end text-end text-sm font-normal">
            {votingPower}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end p-0"
          onClick={() => handleSort("votingPower")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Voting Power ({daoId})
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "votingPower"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-40",
      },
    },
    {
      accessorKey: "variation",
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
      meta: {
        columnClassName: "w-64",
      },
    },
    {
      accessorKey: "delegators",
      cell: ({ row }) => {
        const delegators = row.getValue("delegators") as number;

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-12" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex items-center justify-start text-end text-sm font-normal">
            {delegators}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-start p-0"
          onClick={() => handleSort("delegationsCount")}
        >
          <h4 className="text-table-header">Delegators</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
            activeState={
              sortBy === "delegationsCount"
                ? sortOrder === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      meta: {
        columnClassName: "w-28",
      },
    },
  ];

  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="w-full flex-1">
            <div className="min-h-75 flex h-[calc(100vh-16rem)] w-full flex-col">
              <Table
                columns={delegateColumns}
                data={
                  loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData
                }
                onRowClick={(row) => setDrawerAddress(row.address as Address)}
                size="sm"
                hasMore={pagination.hasNextPage}
                isLoadingMore={fetchingMore}
                onLoadMore={fetchNextPage}
                withDownloadCSV={true}
                error={error}
                fillHeight
              />
            </div>
            <HoldersAndDelegatesDrawer
              isOpen={!!drawerAddress}
              onClose={() => setDrawerAddress(null)}
              entityType="delegate"
              address={drawerAddress || ""}
              daoId={daoId}
            />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}

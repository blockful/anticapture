"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import {
  getAvgVoteTimingData,
  DEFAULT_ITEMS_PER_PAGE,
} from "@/features/holders-and-delegates/utils";
import { TimeInterval } from "@/shared/types/enums";
import { SkeletonRow, Button, SimpleProgressBar } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { Plus } from "lucide-react";
import { ProgressCircle } from "@/features/holders-and-delegates/components/ProgressCircle";
import { DaoIdEnum } from "@/shared/types/daos";
import { useScreenSize, useDaoData } from "@/shared/hooks";
import { Address, formatUnits } from "viem";
import { Table } from "@/shared/components/design-system/table/Table";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";
import daoConfig from "@/shared/dao-config";
import { CopyAndPasteButton } from "@/shared/components/buttons/CopyAndPasteButton";
import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  QueryInput_VotingPowers_OrderBy,
  QueryInput_VotingPowers_OrderDirection,
} from "@anticapture/graphql-client";
import { Tooltip } from "@/shared/components/design-system/tooltips/Tooltip";
import { DAYS_IN_SECONDS } from "@/shared/constants/time-related";
import { PERCENTAGE_NO_BASELINE } from "@/shared/constants/api";
interface DelegateTableData {
  address: string;
  votingPower: string;
  variation?: {
    percentageChange: number;
    absoluteChange: number;
  };
  activity?: string | null;
  activityPercentage?: number | null;
  delegators: number;
  avgVoteTiming?: { text: string; percentage: number } | null;
}

interface DelegatesProps {
  timePeriod?: TimeInterval; // Use TimeInterval enum directly
  daoId: DaoIdEnum;
}

// Converts a TimeInterval to a timestamp (in seconds) representing the start date.
const getFromTimestamp = (period: TimeInterval): number => {
  return Math.floor(Date.now() / 1000) - DAYS_IN_SECONDS[period];
};

export const Delegates = ({
  timePeriod = TimeInterval.THIRTY_DAYS,
  daoId,
}: DelegatesProps) => {
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
    parseAsStringEnum(["delegationsCount", "votingPower"]).withDefault(
      "votingPower",
    ),
  );
  const { decimals } = daoConfig[daoId];
  const { data: daoData } = useDaoData(daoId);

  const votingPeriodSeconds = useMemo(() => {
    if (!daoData?.votingPeriod) return 0;
    const blockTime = daoConfig[daoId].daoOverview.chain.blockTime;
    return (Number(daoData.votingPeriod) * blockTime) / 1000;
  }, [daoData?.votingPeriod, daoId]);

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
  };

  // Calculate time-based parameters
  const fromDate = useMemo(() => getFromTimestamp(timePeriod), [timePeriod]);

  const {
    data,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchingMore,
    isHistoricalLoadingFor,
    isActivityLoadingFor,
  } = useDelegates({
    fromDate,
    orderBy: sortBy as QueryInput_VotingPowers_OrderBy,
    orderDirection: sortOrder as QueryInput_VotingPowers_OrderDirection,
    daoId,
    days: timePeriod,
    address: currentAddressFilter,
    limit: pageLimit,
  });

  const { isMobile } = useScreenSize();

  // Handle sorting for voting power and delegators
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc for votingPower, asc for delegationsCount
      setSortBy(field as "votingPower" | "delegationsCount");
      setSortOrder(field === "votingPower" ? "desc" : "asc");
    }
  };

  const tableData = useMemo(() => {
    if (!data) return [];

    return data.map((delegate): DelegateTableData => {
      const votingPowerBigInt = BigInt(delegate.votingPower || "0");
      const votingPowerFormatted = Number(
        formatUnits(votingPowerBigInt, decimals),
      );

      const activity = delegate.proposalsActivity
        ? `${delegate.proposalsActivity.votedProposals}/${delegate.proposalsActivity.totalProposals}`
        : null;

      const activityPercentage = delegate.proposalsActivity
        ? (delegate.proposalsActivity.votedProposals /
            delegate.proposalsActivity.totalProposals) *
          100
        : null;

      const avgVoteTiming = getAvgVoteTimingData(
        delegate.proposalsActivity?.avgTimeBeforeEnd,
        votingPeriodSeconds,
        delegate.proposalsActivity?.votedProposals,
      );

      return {
        address: delegate.accountId,
        votingPower: formatNumberUserReadable(votingPowerFormatted),
        variation: {
          percentageChange:
            delegate.percentageChange === PERCENTAGE_NO_BASELINE
              ? 9999
              : Number(Number(delegate.percentageChange).toFixed(2)),
          absoluteChange: Number(
            formatUnits(BigInt(delegate.absoluteChange), decimals),
          ),
        },
        activity,
        activityPercentage,
        delegators: delegate.delegationsCount,
        avgVoteTiming,
      };
    });
  }, [data, decimals, votingPeriodSeconds]);

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
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-center">
          Change ({daoId})
        </h4>
      ),
      meta: {
        columnClassName: "w-64",
      },
    },
    {
      accessorKey: "activity",
      cell: ({ row }) => {
        const activity = row.getValue("activity") as string | undefined;
        const activityPercentage = row.original.activityPercentage;
        const addr = row.original.address;
        if (isActivityLoadingFor(addr) || loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-10" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start gap-2">
            <ProgressCircle percentage={activityPercentage || 0} />
            {activity || "0/0"}
          </div>
        );
      },
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-start">
          Activity
        </h4>
      ),
    },
    {
      accessorKey: "avgVoteTiming",
      cell: ({ row }) => {
        const avgVoteTiming = row.getValue("avgVoteTiming") as {
          text: string;
          percentage: number;
        } | null;

        if (loading) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        if (!avgVoteTiming) {
          return <div className="text-secondary text-sm">-</div>;
        }

        return (
          <div className="flex flex-col justify-center gap-1">
            <div
              className={cn("text-secondary text-xs font-normal", {
                "text-end text-sm": avgVoteTiming.text === "-",
              })}
            >
              {avgVoteTiming.text}
            </div>
            {avgVoteTiming.text !== "-" && (
              <SimpleProgressBar percentage={avgVoteTiming.percentage} />
            )}
          </div>
        );
      },
      header: () => (
        <div className="flex items-center gap-1.5">
          <Tooltip tooltipContent="Measures the average of how close to the proposal deadline a vote is cast. Delegates who vote late may be influenced by prior votes or ongoing discussion.">
            <h4 className="text-table-header decoration-secondary/20 group-hover:decoration-primary hover:decoration-primary whitespace-nowrap underline decoration-dashed underline-offset-[6px] transition-colors duration-300">
              Avg Vote Timing
            </h4>
          </Tooltip>
        </div>
      ),
      meta: {
        columnClassName: "w-40",
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
    <>
      <div className="flex h-[calc(100vh-16rem)] min-h-[300px] w-full flex-col">
        <Table
          columns={delegateColumns}
          data={loading ? Array(DEFAULT_ITEMS_PER_PAGE).fill({}) : tableData}
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
    </>
  );
};

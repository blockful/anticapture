import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useDelegates } from "@/features/holders-and-delegates";
import { QueryInput_HistoricalVotingPower_DaoId } from "@anticapture/graphql-client";
import { TimeInterval } from "@/shared/types/enums";
import { TheTable, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { Plus } from "lucide-react";
import { ProgressCircle } from "./ProgressCircle";

interface DelegateTableData {
  address: string;
  type: string;
  votingPower: string;
  variation: string;
  activity: string;
  delegators: number;
}

interface DelegatesProps {
  timePeriod?: TimeInterval; // Use TimeInterval enum directly
  daoId?: QueryInput_HistoricalVotingPower_DaoId;
}

// Helper function to convert time period to timestamp and block number
const getTimeDataFromPeriod = (period: TimeInterval) => {
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  let daysBack: number;
  switch (period) {
    case TimeInterval.SEVEN_DAYS:
      daysBack = 7;
      break;
    case TimeInterval.THIRTY_DAYS:
      daysBack = 30;
      break;
    case TimeInterval.NINETY_DAYS:
      daysBack = 90;
      break;
    case TimeInterval.ONE_YEAR:
      daysBack = 365;
      break;
    default:
      daysBack = 30;
  }

  const fromDate = Math.floor((now - daysBack * msPerDay) / 1000);

  // Rough estimation: 1 block every 12 seconds on Ethereum
  const currentBlock = 20161841;
  const blocksBack = Math.floor((daysBack * 24 * 60 * 60) / 12);
  const blockNumber = currentBlock - blocksBack;

  return { fromDate, blockNumber };
};

export const Delegates = ({
  timePeriod = TimeInterval.THIRTY_DAYS,
  daoId = QueryInput_HistoricalVotingPower_DaoId.Ens,
}: DelegatesProps) => {
  // State for managing sort order
  const [sortBy, setSortBy] = useState<string>("votingPower");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Calculate time-based parameters
  const { fromDate, blockNumber } = useMemo(
    () => getTimeDataFromPeriod(timePeriod),
    [timePeriod],
  );

  const {
    data,
    loading,
    error,
    pagination,
    fetchNextPage,
    fetchPreviousPage,
    fetchingMore,
  } = useDelegates({
    blockNumber,
    fromDate,
    daoId,
    orderBy: sortBy,
    orderDirection: sortDirection,
  });

  // Handle sorting for voting power and delegators
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to desc for votingPower, asc for delegationsCount
      setSortBy(field);
      setSortDirection(field === "votingPower" ? "desc" : "asc");
    }
  };

  // Console log the enriched delegate data with proposals activity
  console.log("Delegates with Proposals Activity:", data);
  console.log("Time parameters:", { timePeriod, fromDate, blockNumber, daoId });
  console.log("Pagination state:", pagination);
  console.log("Loading states:", { loading, fetchingMore });

  const tableData = useMemo(() => {
    if (!data) return [];

    return data.map((delegate): DelegateTableData => {
      const votingPowerBigInt = BigInt(delegate.votingPower || "0");
      const votingPowerFormatted = Number(votingPowerBigInt / BigInt(10 ** 18));

      // Get activity from real proposals data
      const activity = delegate.proposalsActivity
        ? `${delegate.proposalsActivity.votedProposals}/${delegate.proposalsActivity.totalProposals}`
        : "0/0";

      const activityPercentage =
        (delegate.proposalsActivity?.votedProposals || 0) /
        (delegate.proposalsActivity?.totalProposals || 1);

      // Calculate variation using real historical voting power
      let variation = "0 ENS 0%";
      if (delegate.historicalVotingPower && votingPowerFormatted > 0) {
        const historicalVotingPowerBigInt = BigInt(
          delegate.historicalVotingPower,
        );
        const historicalVotingPowerFormatted = Number(
          historicalVotingPowerBigInt / BigInt(10 ** 18),
        );

        // Calculate absolute change and percentage
        const absoluteChange =
          votingPowerFormatted - historicalVotingPowerFormatted;
        const percentageChange = (absoluteChange / votingPowerFormatted) * 100;
        const roundedPercentage = Math.round(percentageChange * 100) / 100;

        // Format the variation string
        const absChangeFormatted = formatNumberUserReadable(
          Math.abs(absoluteChange),
        );
        const arrow = absoluteChange > 0 ? "↑" : absoluteChange < 0 ? "↓" : "";

        variation = `${absChangeFormatted} ENS ${arrow} ${Math.abs(roundedPercentage)}%`;
      }

      return {
        address: delegate.account?.id || "",
        type: delegate.account?.type || "",
        votingPower: formatNumberUserReadable(votingPowerFormatted),
        variation: variation,
        activity,
        delegators: delegate.delegationsCount,
      };
    });
  }, [data]);

  const delegateColumns: ColumnDef<DelegateTableData>[] = [
    {
      accessorKey: "address",
      size: 280,
      cell: ({ row }) => {
        const address = row.getValue("address") as string;
        const type = row.getValue("type") as string;

        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 px-4 py-2">
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
          <div className="flex h-10 items-center gap-3 px-4 py-2">
            <EnsAvatar
              address={address as `0x${string}`}
              size="sm"
              variant="rounded"
              showName={true}
            />
            <button
              className="bg-surface-default text-primary hover:bg-surface-contrast flex cursor-pointer items-center gap-1.5 rounded-md border border-[#3F3F46] px-2 py-1 opacity-0 transition-opacity duration-300 [tr:hover_&]:opacity-100"
              tabIndex={-1}
              onClick={(e) => {}}
            >
              <Plus className="size-3.5" />
              <span className="text-sm font-medium">Details</span>
            </button>
          </div>
        );
      },
      header: () => <h4 className="text-table-header pl-4">Address</h4>,
    },
    {
      accessorKey: "type",
      size: 100,
      cell: ({ row }) => {
        const type = row.getValue("type") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="flex h-10 items-center px-4 py-2">
            <span
              className={cn(
                "rounded-full px-2 py-1 text-xs font-medium",
                type === "Contract"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-gray-500/20 text-gray-400",
              )}
            >
              {type}
            </span>
          </div>
        );
      },
      header: () => <h4 className="text-table-header px-4">Type</h4>,
      enableSorting: false,
    },
    {
      accessorKey: "votingPower",
      size: 150,
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse justify-end pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="text-secondary flex h-10 items-center justify-end px-4 py-2 text-end text-sm font-normal">
            {votingPower} ENS
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          className="flex w-full justify-end px-4"
          onClick={() => handleSort("votingPower")}
        >
          <h4 className="text-table-header">Voting Power</h4>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              sortBy === "votingPower"
                ? sortDirection === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "variation",
      size: 250,
      cell: ({ row }) => {
        const variation = row.getValue("variation") as string;

        if (loading) {
          return (
            <div className="flex items-center justify-start px-4">
              <SkeletonRow
                className="h-5 w-16"
                parentClassName="justify-start flex animate-pulse"
              />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-start gap-1 px-4 py-2 text-end text-sm whitespace-nowrap">
            <span className="text-secondary">
              {variation.split(" ")[0]} ENS
            </span>
            <span
              className={cn(
                variation.includes("↑")
                  ? "text-success"
                  : variation.includes("↓")
                    ? "text-error"
                    : "text-secondary",
              )}
            >
              {variation.split(" ").slice(2).join(" ")}
            </span>
          </div>
        );
      },
      header: () => (
        <h4 className="text-table-header w-full justify-end px-4">Variation</h4>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "activity",
      size: 150,
      cell: ({ row }) => {
        const activity = row.getValue("activity") as string;
        const activityPercentage =
          parseInt(row.original.activity.split("/")[0] || "0") /
          parseInt(row.original.activity.split("/")[1] || "1");

        if (loading) {
          return (
            <div className="flex items-center justify-start px-4">
              <SkeletonRow className="h-5 w-10" />
            </div>
          );
        }

        return (
          <div className="flex h-10 items-center justify-start gap-2 px-4 py-2">
            <ProgressCircle percentage={activityPercentage} />
            {activity}
          </div>
        );
      },
      header: () => (
        <h4 className="text-table-header w-full justify-center px-4">
          Activity
        </h4>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "delegators",
      size: 120,
      cell: ({ row }) => {
        const delegators = row.getValue("delegators") as number;

        if (loading) {
          return (
            <div className="flex items-center justify-start px-4">
              <SkeletonRow className="h-5 w-12" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex h-10 items-center justify-start px-4 py-2 text-end text-sm font-normal">
            {delegators}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          className="flex w-full justify-end px-4"
          onClick={() => handleSort("delegationsCount")}
        >
          <h4 className="text-table-header">Delegators</h4>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              sortBy === "delegationsCount"
                ? sortDirection === "asc"
                  ? ArrowState.UP
                  : ArrowState.DOWN
                : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <TheTable
          columns={delegateColumns}
          data={Array.from({ length: 10 }, (_, i) => ({
            address: `0x${"0".repeat(40)}`,
            type: "",
            votingPower: "0",
            variation: "0%",
            activity: "0/0",
            delegators: 0,
          }))}
          withPagination={true}
          withSorting={true}
        />

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPrevious={fetchPreviousPage}
          onNext={fetchNextPage}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          isLoading={fetchingMore}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-error">
          Error loading delegates: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <TheTable
        columns={delegateColumns}
        data={tableData}
        withPagination={true}
        withSorting={true}
        onRowClick={(row) => {
          console.log("Row clicked:", row);
        }}
      />

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPrevious={fetchPreviousPage}
        onNext={fetchNextPage}
        hasNextPage={pagination.hasNextPage}
        hasPreviousPage={pagination.hasPreviousPage}
        isLoading={fetchingMore}
      />
    </div>
  );
};

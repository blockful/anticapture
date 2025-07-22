import { useMemo, useState } from "react";
import { ColumnDef, HeaderContext } from "@tanstack/react-table";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import { TimeInterval } from "@/shared/types/enums";
import { TheTable, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { Plus } from "lucide-react";
import { ProgressCircle } from "@/features/holders-and-delegates/components/ProgressCircle";
import { DaoIdEnum } from "@/shared/types/daos";
import { useScreenSize } from "@/shared/hooks";
import { Address } from "viem";

interface DelegateTableData {
  address: string;
  votingPower: string;
  variation: string;
  activity: string;
  activityPercentage: number;
  delegators: number;
}

interface DelegatesProps {
  timePeriod?: TimeInterval; // Use TimeInterval enum directly
  daoId: DaoIdEnum;
}

// Helper function to convert time period to timestamp and block number
export const getTimeDataFromPeriod = (period: TimeInterval) => {
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

  return Math.floor((now - daysBack * msPerDay) / 1000);
};

export const Delegates = ({
  timePeriod = TimeInterval.THIRTY_DAYS,
  daoId,
}: DelegatesProps) => {
  // State for managing sort order
  const [sortBy, setSortBy] = useState<string>("votingPower");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Calculate time-based parameters
  const fromDate = useMemo(
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
    historicalDataLoading,
  } = useDelegates({
    fromDate,
    orderBy: sortBy,
    orderDirection: sortDirection,
    daoId,
    days: timePeriod,
  });

  const [selectedDelegate, setSelectedDelegate] = useState<string | null>(null);
  const { isMobile } = useScreenSize();

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

  const handleOpenDrawer = (address: string) => {
    setSelectedDelegate(address);
  };

  const handleCloseDrawer = () => {
    setSelectedDelegate(null);
  };

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
        ((delegate.proposalsActivity?.votedProposals || 0) /
          (delegate.proposalsActivity?.totalProposals || 1)) *
        100;

      // Calculate variation using real historical voting power
      let variation = "0 0%";
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
        const percentageChange =
          (votingPowerFormatted / historicalVotingPowerFormatted) * 100 - 100;
        const roundedPercentage = Math.round(percentageChange * 100) / 100;
        const absPercentage = Math.abs(roundedPercentage);
        const displayPercentage =
          absPercentage > 1000 ? ">1000" : absPercentage.toString();

        // Format the variation string
        const absChangeFormatted = formatNumberUserReadable(
          Math.abs(absoluteChange),
        );
        const arrow = absoluteChange > 0 ? "↑" : absoluteChange < 0 ? "↓" : "";

        variation = `${absChangeFormatted} ${arrow} ${displayPercentage}%`;
      }

      return {
        address: delegate.accountId || "",
        votingPower: formatNumberUserReadable(votingPowerFormatted),
        variation: variation,
        activity,
        activityPercentage,
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
        if (loading) {
          return (
            <div className="flex h-10 items-center gap-3 p-2">
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
          <div className="flex h-10 items-center gap-3 p-2">
            <EnsAvatar
              address={address as `0x${string}`}
              size="sm"
              variant="rounded"
              showName={true}
            />
            {!isMobile && (
              <button
                className="bg-surface-default text-primary hover:bg-surface-contrast flex cursor-pointer items-center gap-1.5 rounded-md border border-[#3F3F46] px-2 py-1 opacity-0 transition-opacity duration-300 [tr:hover_&]:opacity-100"
                tabIndex={-1}
                onClick={() => handleOpenDrawer(address)}
              >
                <Plus className="size-3.5" />
                <span className="text-sm font-medium">Details</span>
              </button>
            )}
          </div>
        );
      },
      header: () => (
        <h4 className="text-table-header flex h-8 w-full items-center justify-start pl-4">
          Address
        </h4>
      ),
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
            {votingPower}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          className="flex h-8 w-full justify-end rounded-b-none px-4"
          onClick={() => handleSort("votingPower")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Voting Power ({daoId})
          </h4>
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

        if (historicalDataLoading || loading) {
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
          <div className="flex h-10 items-center justify-start gap-1 whitespace-nowrap px-4 py-2 text-end text-sm">
            <span className="text-secondary">{variation.split(" ")[0]}</span>
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
        <h4 className="text-table-header flex h-8 w-full items-center justify-start px-4">
          Variation
        </h4>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "activity",
      size: 150,
      cell: ({ row }) => {
        const activity = row.getValue("activity") as string;
        const activityPercentage = row.original.activityPercentage;

        if (historicalDataLoading || loading) {
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
        <h4 className="text-table-header flex h-8 w-full items-center justify-start px-4">
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
          className="flex h-8 w-full justify-end rounded-b-none px-4"
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
          data={Array.from({ length: 10 }, () => ({
            address: `0x${"0".repeat(40)}`,
            type: "",
            votingPower: "0",
            variation: "0%",
            activity: "0/0",
            activityPercentage: 0,
            delegators: 0,
          }))}
          withPagination={true}
          withSorting={true}
          isTableSmall={true}
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
      <div className="flex flex-col gap-2">
        <div className="md:border-light-dark relative w-full overflow-auto md:rounded-lg md:border">
          <table className="bg-surface-background text-secondary md:bg-surface-default w-full table-auto caption-bottom text-sm md:table-fixed">
            <thead className="text-secondary sm:bg-surface-contrast text-xs font-semibold sm:font-medium [&_th:first-child]:border-r md:[&_th]:border-none [&_tr]:border-b">
              <tr className="border-light-dark">
                {delegateColumns.map((column, index) => (
                  <th
                    key={index}
                    className="h-8 text-left [&:has([role=checkbox])]:pr-0"
                    style={{
                      width: column.size !== 150 ? column.size : "auto",
                    }}
                  >
                    {typeof column.header === "function"
                      ? column.header({
                          column: {
                            getIsSorted: () => false,
                            toggleSorting: () => {},
                          },
                        } as HeaderContext<DelegateTableData, unknown>)
                      : column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="scrollbar-none [&_tr:last-child]:border-0">
              <tr className="hover:bg-surface-contrast transition-colors duration-300">
                <td
                  colSpan={delegateColumns.length}
                  className="bg-light h-[410px] p-0 text-center"
                >
                  <div className="flex h-full items-center justify-center">
                    <div className="text-error">
                      Error loading delegates: {error.message}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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

  return (
    <>
      <div className="flex flex-col gap-2">
        <TheTable
          columns={delegateColumns}
          data={tableData}
          withPagination={true}
          withSorting={true}
          onRowClick={(row) => handleOpenDrawer(row.address as Address)}
          isTableSmall={true}
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
      <HoldersAndDelegatesDrawer
        isOpen={!!selectedDelegate}
        onClose={handleCloseDrawer}
        entityType="delegate"
        address={
          selectedDelegate || "0x0000000000000000000000000000000000000000"
        }
        daoId={daoId as DaoIdEnum}
      />
    </>
  );
};

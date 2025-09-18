import { useMemo, useState } from "react";
import { ColumnDef, HeaderContext } from "@tanstack/react-table";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import { TimeInterval } from "@/shared/types/enums";
import { SkeletonRow, BlankSlate } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { Inbox, Plus } from "lucide-react";
import { ProgressCircle } from "@/features/holders-and-delegates/components/ProgressCircle";
import { DaoIdEnum } from "@/shared/types/daos";
import { useScreenSize } from "@/shared/hooks";
import { Address } from "viem";
import { AddressFilter } from "@/shared/components/design-system/filters/AddressFilter";
import { Table } from "@/shared/components/design-system/table/Table";

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

  // State for address filtering
  const [currentAddressFilter, setCurrentAddressFilter] = useState<string>("");

  const handleAddressFilterApply = (address: string | undefined) => {
    setCurrentAddressFilter(address || "");
  };

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
    fetchingMore,
    isHistoricalLoadingFor,
    isActivityLoadingFor,
  } = useDelegates({
    fromDate,
    orderBy: sortBy,
    orderDirection: sortDirection,
    daoId,
    days: timePeriod,
    address: currentAddressFilter,
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
          <div className="flex items-center gap-3">
            <EnsAvatar
              address={address as `0x${string}`}
              size="sm"
              variant="rounded"
              showName={true}
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
            {!isMobile && (
              <div className="bg-surface-default text-primary flex items-center gap-1.5 rounded-md border border-[#3F3F46] px-2 py-1 opacity-0 transition-opacity [tr:hover_&]:opacity-100">
                <Plus className="size-3.5" />
                <p className="text-sm font-medium">Details</p>
              </div>
            )}
          </div>
        );
      },
      header: () => (
        <div className="text-table-header flex w-full items-center justify-start">
          <p>Address</p>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter}
            className="ml-2"
          />
        </div>
      ),
      meta: {
        columnClassName: "w-72",
      },
    },
    {
      accessorKey: "votingPower",
      meta: {
        columnClassName: "w-80",
      },
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
          <div className="text-secondary flex items-center justify-end text-end text-sm font-normal">
            {votingPower}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          className="flex h-min w-full justify-end rounded-b-none p-0"
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
      meta: {
        columnClassName: "w-64",
      },
      cell: ({ row }) => {
        const variation = row.getValue("variation") as string;
        const addr = row.original.address;

        if (isHistoricalLoadingFor(addr)) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow
                className="h-5 w-16"
                parentClassName="justify-start flex animate-pulse"
              />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start gap-1 whitespace-nowrap text-end text-sm">
            <p className="text-secondary">{variation.split(" ")[0]}</p>
            <p
              className={cn(
                variation.includes("↑")
                  ? "text-success"
                  : variation.includes("↓")
                    ? "text-error"
                    : "text-secondary",
              )}
            >
              {variation.split(" ").slice(2).join(" ")}
            </p>
          </div>
        );
      },
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-start">
          Variation
        </h4>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "activity",
      cell: ({ row }) => {
        const activity = row.getValue("activity") as string;
        const activityPercentage = row.original.activityPercentage;
        const addr = row.original.address;
        if (isActivityLoadingFor(addr)) {
          return (
            <div className="flex items-center justify-start">
              <SkeletonRow className="h-5 w-10" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-start gap-2">
            <ProgressCircle percentage={activityPercentage} />
            {activity}
          </div>
        );
      },
      header: () => (
        <h4 className="text-table-header flex w-full items-center justify-start">
          Activity
        </h4>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "delegators",
      meta: {
        columnClassName: "w-28",
      },
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
          className="flex h-min w-full rounded-b-none p-0"
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
        <Table
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
          withSorting={true}
          size="sm"
          wrapperClassName="max-h-[475px]"
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
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Table
          columns={delegateColumns}
          data={tableData}
          withSorting={true}
          onRowClick={(row) => handleOpenDrawer(row.address as Address)}
          size="sm"
          customEmptyState={
            <BlankSlate
              variant="default"
              icon={Inbox}
              title=""
              className="h-full rounded-none"
              description="No addresses found"
            />
          }
          hasMore={pagination.hasNextPage}
          isLoadingMore={fetchingMore}
          onLoadMore={fetchNextPage}
          wrapperClassName="max-h-[475px]"
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

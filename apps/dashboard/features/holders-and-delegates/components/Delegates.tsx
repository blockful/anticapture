import { useMemo, useState } from "react";
import { ColumnDef, HeaderContext } from "@tanstack/react-table";

import {
  useDelegates,
  HoldersAndDelegatesDrawer,
} from "@/features/holders-and-delegates";
import { TimeInterval } from "@/shared/types/enums";
import { TheTable, SkeletonRow, BlankSlate, Button } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable } from "@/shared/utils";
import { Pagination } from "@/shared/components/design-system/table/Pagination";
import { Percentage } from "@/shared/components/design-system/table/Percentage";
import { Inbox, Plus } from "lucide-react";
import { ProgressCircle } from "@/features/holders-and-delegates/components/ProgressCircle";
import { DaoIdEnum } from "@/shared/types/daos";
import { useScreenSize } from "@/shared/hooks";
import { Address } from "viem";
import { AddressFilter } from "@/shared/components/design-system/table/filters/AddressFilter";

interface DelegateTableData {
  address: string;
  votingPower: string;
  variation: { percentageChange: number; absoluteChange: number };
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
    fetchPreviousPage,
    fetchingMore,
    historicalDataLoading,
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
      let variation = { percentageChange: 0, absoluteChange: 0 };
      if (delegate.historicalVotingPower && votingPowerFormatted > 0) {
        const historicalVotingPowerBigInt = BigInt(
          delegate.historicalVotingPower,
        );
        const historicalVotingPowerFormatted = Number(
          historicalVotingPowerBigInt / BigInt(10 ** 18),
        );

        if (historicalVotingPowerFormatted === 0) {
          variation = { percentageChange: 0, absoluteChange: 0 };
        } else {
          // Calculate absolute change and percentage
          const absoluteChange =
            votingPowerFormatted - historicalVotingPowerFormatted;
          const percentageChange =
            ((votingPowerFormatted - historicalVotingPowerFormatted) /
              historicalVotingPowerFormatted) *
            100;

          variation = {
            percentageChange: Number(percentageChange.toFixed(2)),
            absoluteChange: Number(absoluteChange.toFixed(2)),
          };
        }
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
              isDashed={true}
              nameClassName="[tr:hover_&]:border-primary"
            />
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="opacity-0 transition-opacity [tr:hover_&]:opacity-100"
              >
                <Plus className="size-3.5" />
                <p className="text-sm font-medium">Details</p>
              </Button>
            )}
          </div>
        );
      },
      header: () => (
        <div className="text-table-header flex h-8 w-full items-center justify-start px-2">
          <p>Address</p>
          <AddressFilter
            onApply={handleAddressFilterApply}
            currentFilter={currentAddressFilter}
            className="ml-2"
          />
        </div>
      ),
    },
    {
      accessorKey: "votingPower",
      size: 160,
      cell: ({ row }) => {
        const votingPower = row.getValue("votingPower") as string;

        if (loading) {
          return (
            <SkeletonRow
              parentClassName="flex animate-pulse justify-end w-full pr-4"
              className="h-5 w-full max-w-20"
            />
          );
        }

        return (
          <div className="text-secondary h-10 w-full items-center justify-end px-4 py-2 text-end text-sm font-normal">
            {votingPower}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end"
          onClick={() => handleSort("votingPower")}
        >
          <h4 className="text-table-header whitespace-nowrap">
            Voting Power ({daoId})
          </h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
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
        const variation = row.getValue("variation") as {
          percentageChange: number;
          absoluteChange: number;
        };

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
          <div className="flex h-10 w-full items-center justify-start gap-2 px-4 py-2 text-sm">
            {formatNumberUserReadable(Math.abs(variation.absoluteChange))}
            <Percentage value={variation.percentageChange} />
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
      size: 160,
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
            <div className="flex w-full items-center justify-end px-4">
              <SkeletonRow className="h-5 w-12" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex h-10 w-full items-center justify-end px-4 py-2 text-end text-sm font-normal">
            {delegators}
          </div>
        );
      },
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="text-secondary w-full justify-end"
          onClick={() => handleSort("delegationsCount")}
        >
          <h4 className="text-table-header">Delegators</h4>
          <ArrowUpDown
            props={{ className: "size-4" }}
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
            variation: { percentageChange: 0, absoluteChange: 0 },
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
          <table className="bg-surface-background text-secondary md:bg-surface-default w-full table-auto caption-bottom text-sm">
            <thead className="text-secondary sm:bg-surface-contrast text-xs font-semibold sm:font-medium [&_th:first-child]:border-r md:[&_th]:border-none [&_tr]:border-b">
              <tr className="border-light-dark">
                {delegateColumns.map((column, index) => (
                  <th
                    key={index}
                    className="h-8 text-left [&:has([role=checkbox])]:pr-0"
                    style={{
                      width: column.size ? column.size : "auto",
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
          showWhenEmpty={
            <BlankSlate
              variant="default"
              icon={Inbox}
              title=""
              className="h-full rounded-none"
              description="No addresses found"
            />
          }
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

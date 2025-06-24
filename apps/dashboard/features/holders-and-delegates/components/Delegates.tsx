import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useDelegates } from "@/features/holders-and-delegates";
import { TheTable, SkeletonRow } from "@/shared/components";
import { EnsAvatar } from "@/shared/components/design-system/avatars/ens-avatar/EnsAvatar";
import { Button } from "@/shared/components/ui/button";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { formatNumberUserReadable, cn } from "@/shared/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

interface DelegateTableData {
  address: string;
  type: string;
  votingPower: string;
  variation: number;
  activity: number;
  delegators: number;
}

// Mock data for activity and delegators as requested
const mockActivityData: Record<string, number> = {};
const mockDelegatorsData: Record<string, number> = {};

const generateMockData = (address: string) => {
  if (!mockActivityData[address]) {
    mockActivityData[address] = Math.floor(Math.random() * 5) + 1; // 1-5 for activity
  }
  if (!mockDelegatorsData[address]) {
    mockDelegatorsData[address] = Math.floor(Math.random() * 200) + 50; // 50-250 for delegators
  }
  return {
    activity: mockActivityData[address],
    delegators: mockDelegatorsData[address],
  };
};

const ActivityIndicator = ({
  value,
  total = 5,
}: {
  value: number;
  total?: number;
}) => {
  const percentage = (value / total) * 100;
  const filledDots = Math.round((value / total) * total);

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "size-2 rounded-full",
              i < filledDots ? "bg-success" : "bg-surface-contrast",
            )}
          />
        ))}
      </div>
      <span className="text-secondary ml-1 text-xs">
        {value}/{total} ({percentage.toFixed(0)}%)
      </span>
    </div>
  );
};

export const Delegates = () => {
  const { data, loading, error } = useDelegates();

  // Console log the enriched delegate data with proposals activity
  console.log("Delegates with Proposals Activity:", data);

  const tableData = useMemo(() => {
    if (!data) return [];

    return data.map((delegate): DelegateTableData => {
      const mockData = generateMockData(delegate.account?.id || "");
      const votingPowerBigInt = BigInt(delegate.votingPower || "0");
      const votingPowerFormatted = Number(votingPowerBigInt / BigInt(10 ** 18));

      return {
        address: delegate.account?.id || "",
        type: delegate.account?.type || "EOA",
        votingPower: formatNumberUserReadable(votingPowerFormatted),
        variation: Math.random() * 20 - 10, // Random variation between -10% and +10%
        activity: mockData.activity,
        delegators: mockData.delegators,
      };
    });
  }, [data]);

  const delegateColumns: ColumnDef<DelegateTableData>[] = [
    {
      accessorKey: "address",
      size: 200,
      cell: ({ row }) => {
        const address = row.getValue("address") as string;
        const type = row.getValue("type") as string;

        return (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="size-6">
              <EnsAvatar
                address={address as `0x${string}`}
                size="sm"
                variant="rounded"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-primary text-sm font-medium">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
            </div>
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

        return (
          <div className="flex items-center px-4 py-3">
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header px-4"
          onClick={() => column.toggleSorting()}
        >
          Type
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
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
          <div className="text-secondary flex items-center justify-end px-4 py-3 text-end text-sm font-normal">
            {votingPower} ENS
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="flex w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Voting Power</h4>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const a = parseFloat(rowA.getValue("votingPower") as string) || 0;
        const b = parseFloat(rowB.getValue("votingPower") as string) || 0;
        return a - b;
      },
    },
    {
      accessorKey: "variation",
      size: 120,
      cell: ({ row }) => {
        const variation = row.getValue("variation") as number;

        if (loading) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow
                className="h-5 w-16"
                parentClassName="justify-end flex animate-pulse"
              />
            </div>
          );
        }

        return (
          <p
            className={cn(
              "flex items-center justify-end gap-1 px-4 py-3 text-end text-sm",
              variation > 0
                ? "text-success"
                : variation < 0
                  ? "text-error"
                  : "text-secondary",
            )}
          >
            {variation > 0 ? (
              <ChevronUp className="text-success size-4" />
            ) : variation < 0 ? (
              <ChevronDown className="text-error size-4" />
            ) : null}
            {variation > 0 ? "+" : ""}
            {variation.toFixed(1)}%
          </p>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          Variation
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "activity",
      size: 150,
      cell: ({ row }) => {
        const activity = row.getValue("activity") as number;

        if (loading) {
          return (
            <div className="flex items-center justify-center">
              <SkeletonRow className="h-5 w-20" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center px-4 py-3">
            <ActivityIndicator value={activity} />
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-center px-4"
          onClick={() => column.toggleSorting()}
        >
          Activity
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "delegators",
      size: 120,
      cell: ({ row }) => {
        const delegators = row.getValue("delegators") as number;

        if (loading) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow className="h-5 w-12" />
            </div>
          );
        }

        return (
          <div className="text-secondary flex items-center justify-end px-4 py-3 text-end text-sm font-normal">
            {delegators}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="flex w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          <h4 className="text-table-header">Delegators</h4>
          <ArrowUpDown
            props={{ className: "ml-2 size-4" }}
            activeState={
              column.getIsSorted() === "asc"
                ? ArrowState.UP
                : column.getIsSorted() === "desc"
                  ? ArrowState.DOWN
                  : ArrowState.DEFAULT
            }
          />
        </Button>
      ),
      enableSorting: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex">
        <TheTable
          columns={delegateColumns}
          data={Array.from({ length: 5 }, (_, i) => ({
            address: `0x${"0".repeat(40)}`,
            type: "EOA",
            votingPower: "0",
            variation: 0,
            activity: 0,
            delegators: 0,
          }))}
          withPagination={true}
          withSorting={true}
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
    <div className="flex">
      <TheTable
        columns={delegateColumns}
        data={tableData}
        withPagination={true}
        withSorting={true}
      />
    </div>
  );
};

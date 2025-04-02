"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GovernanceActivity } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  TheTable,
  TooltipInfo,
  ArrowState,
  Sparkline,
  SkeletonRow,
} from "@/components/atoms";
import {
  cn,
  formatNumberUserReadable,
  formatVariation,
} from "@/lib/client/utils";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";
import { useGovernanceActivityContext } from "@/contexts/GovernanceActivityContext";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<GovernanceActivity>,
  rowB: Row<GovernanceActivity>,
  columnId: string,
) => {
  const a = Number(rowA.getValue(columnId)) ?? 0;
  const b = Number(rowB.getValue(columnId)) ?? 0;
  return a - b;
};

const metricDetails: Record<
  string,
  { icon: React.ReactNode; tooltip: string }
> = {
  Treasury: {
    icon: undefined,
    tooltip:
      "The total number of governance tokens held in the DAO's treasury period.",
  },
  Proposals: {
    icon: undefined,
    tooltip: "The number of proposals created in the selected period.",
  },
  "Active Supply": {
    icon: undefined,
    tooltip:
      "The total voting power of delegates who voted in proposals during the selected period.",
  },
  Votes: {
    icon: undefined,
    tooltip: "The total number of votes cast in the selected period.",
  },
  "Average Turnout": {
    icon: undefined,
    tooltip:
      "The average number of votes per proposal during the selected period.",
  },
};

export const GovernanceActivityTable = () => {
  const {
    days,
    treasury,
    treasurySupplyChart,
    proposals,
    activeSupply,
    votes,
    averageTurnout,
  } = useGovernanceActivityContext();

  const governanceActivityColumns: ColumnDef<GovernanceActivity>[] = [
    {
      accessorKey: "metric",
      cell: ({ row }) => {
        const metric: string = row.getValue("metric");
        const details = metric ? metricDetails[metric] : null;

        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto px-4 py-3 text-[#fafafa]">
            {details && details.icon}
            {metric}
            {details && <TooltipInfo text={details.tooltip} />}
          </p>
        );
      },
      header: () => (
        <div className="flex w-full items-start justify-start px-4">
          Metrics
        </div>
      ),
    },
    {
      accessorKey: "average",
      cell: ({ row }) => {
        const average: number = row.getValue("average");

        if (!average) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow className="h-5 w-32" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end px-4 text-end">
            {average && formatNumberUserReadable(average)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          Average
          <ArrowUpDown
            props={{
              className: "ml-2 h-4 w-4",
            }}
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
      sortingFn: sortingByAscendingOrDescendingNumber,
    },
    {
      accessorKey: "variation",
      cell: ({ row }) => {
        const variation: string = row.getValue("variation");
        if (!variation) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow className="h-5 w-32" />
            </div>
          );
        }
        if (variation == "-") {
          return (
            <p className="flex items-center justify-end gap-1 px-4 py-3 text-end">
              -
            </p>
          );
        }
        return (
          <p
            className={`flex items-center justify-end gap-1 px-4 py-3 text-end ${
              Number(variation) > 0
                ? "text-[#4ade80]"
                : Number(variation) < 0
                  ? "text-red-500"
                  : ""
            }`}
          >
            {Number(variation) > 0 ? (
              <ChevronUp className="h-4 w-4 text-[#4ade80]" />
            ) : Number(variation) < 0 ? (
              <ChevronDown className="h-4 w-4 text-red-500" />
            ) : null}
            {variation}%
          </p>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          Variation
          <ArrowUpDown
            props={{ className: "ml-2 h-4 w-4" }}
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
      sortingFn: sortingByAscendingOrDescendingNumber,
    },
    {
      accessorKey: "chartLastDays",
      cell: ({ row }) => {
        const variation: string = row.getValue("variation");

        const chartLastDays: DaoMetricsDayBucket[] =
          row.getValue("chartLastDays") ?? [];

        if (variation === null) {
          return (
            <div className="flex w-full px-4 py-3">
              <SkeletonRow className="h-5 w-[320px]" />
            </div>
          );
        }

        return (
          <div className="flex h-[52px] w-full items-start justify-start">
            <Sparkline
              data={chartLastDays.map((item) => Number(item.high))}
              strokeColor={cn([Number(variation) < 0 ? "#ef4444" : "#4ADE80"])}
            />
          </div>
        );
      },
      header: ({ column }) => (
        <div className="flex w-full items-start justify-start px-10">
          Last {days.slice(0, -1)} days
        </div>
      ),
    },
  ];

  return (
    <TheTable
      columns={governanceActivityColumns}
      data={[
        {
          metric: "Treasury",
          average: treasury.value ? treasury.value : null,
          variation: treasury.changeRate
            ? formatVariation(treasury.changeRate)
            : null,
          chartLastDays: treasurySupplyChart,
        },
        {
          metric: "Proposals",
          average: proposals.value ?? null,
          variation:
            proposals.changeRate == "0"
              ? "0.00"
              : proposals.changeRate
                ? formatVariation(proposals.changeRate)
                : null,
        },
        {
          metric: "Active Supply",
          average: activeSupply.value
            ? String(BigInt(activeSupply.value) / BigInt(10 ** 18))
            : null,
          variation: activeSupply.changeRate
            ? formatVariation(activeSupply.changeRate)
            : "-",
        },
        {
          metric: "Votes",
          average: votes.value ? votes.value : null,
          variation:
            votes.changeRate == "0"
              ? "0.00"
              : votes.changeRate
                ? formatVariation(votes.changeRate)
                : null,
        },
        {
          metric: "Average Turnout",
          average: averageTurnout.value ? averageTurnout.value : null,
          variation:
            averageTurnout.changeRate == "0"
              ? "0.00"
              : averageTurnout.changeRate
                ? formatVariation(averageTurnout.changeRate)
                : null,
        },
      ]}
      withPagination={true}
      withSorting={true}
      onRowClick={() => {}}
    />
  );
};

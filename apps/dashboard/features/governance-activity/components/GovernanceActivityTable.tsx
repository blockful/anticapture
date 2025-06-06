"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GovernanceActivity } from "@/shared/constants/mocked-data/mocked-data";
import { Button } from "@/shared/components/ui/button";
import {
  TheTable,
  TooltipInfo,
  Sparkline,
  SkeletonRow,
} from "@/shared/components";
import { formatVariation } from "@/shared/utils";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { useGovernanceActivityContext } from "@/features/governance-activity/contexts/GovernanceActivityContext";
import { formatEther } from "viem";
import { ArrowUpDown, ArrowState } from "@/shared/components/icons";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { ReactNode } from "react";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<GovernanceActivity>,
  rowB: Row<GovernanceActivity>,
  columnId: string,
) => {
  const a = Number(rowA.getValue(columnId)) ?? 0;
  const b = Number(rowB.getValue(columnId)) ?? 0;
  return a - b;
};

const metricDetails: Record<string, { icon: ReactNode; tooltip: string }> = {
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
          <div className="scrollbar-none text-primary flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto px-4 py-3">
            {details && details.icon}
            {metric}
            {details && <TooltipInfo text={details.tooltip} />}
          </div>
        );
      },
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start px-4">
          Metrics
        </div>
      ),
    },
    {
      accessorKey: "average",
      cell: ({ row }) => {
        const average: string = row.getValue("average");

        if (!average) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow className="h-5 w-32" />
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end px-4 text-end">
            {average}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-end px-4"
          onClick={() => column.toggleSorting()}
        >
          Average
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
                ? "text-success"
                : Number(variation) < 0
                  ? "text-error"
                  : ""
            }`}
          >
            {Number(variation) > 0 ? (
              <ChevronUp className="text-success size-4" />
            ) : Number(variation) < 0 ? (
              <ChevronDown className="text-error size-4" />
            ) : null}
            {variation}%
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
          <div className="flex w-full justify-center py-2.5">
            <Sparkline
              data={chartLastDays.map((item) => Number(item.high))}
              strokeColor={cn([Number(variation) < 0 ? "#f87171" : "#4ade80"])}
            />
          </div>
        );
      },
      header: ({ column }) => (
        <div className="text-table-header flex w-full items-start justify-start px-10">
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
          average: treasury.value
            ? formatNumberUserReadable(Number(treasury.value))
            : null,
          variation: treasury.changeRate
            ? formatVariation(treasury.changeRate)
            : null,
          chartLastDays: treasurySupplyChart,
        },
        {
          metric: "Proposals",
          average: proposals.value
            ? formatNumberUserReadable(Number(proposals.value), 0)
            : null,
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
            ? formatNumberUserReadable(
                Number(formatEther(BigInt(activeSupply.value))),
              )
            : null,
          variation: activeSupply.changeRate
            ? formatVariation(activeSupply.changeRate)
            : "-",
        },
        {
          metric: "Votes",
          average: votes.value
            ? formatNumberUserReadable(Number(votes.value), 0)
            : null,
          variation:
            votes.changeRate == "0"
              ? "0.00"
              : votes.changeRate
                ? formatVariation(votes.changeRate)
                : null,
        },
        {
          metric: "Average Turnout",
          average: averageTurnout.value
            ? formatNumberUserReadable(Number(averageTurnout.value), 2)
            : null,
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
    />
  );
};

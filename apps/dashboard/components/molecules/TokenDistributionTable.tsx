"use client";

import React from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TokenDistribution } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowState,
  ArrowUpDown,
  Sparkline,
  TheTable,
  TooltipInfo,
} from "@/components/atoms";
import { DaoMetricsDayBucket } from "@/lib/dao-constants/types";
import { useDaoDataContext } from "@/contexts/DaoDataContext";
import {
  cn,
  formatNumberUserReadable,
  formatVariation,
} from "@/lib/client/utils";
import { useTokenDistributionContext } from "@/contexts/TokenDistributionContext";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<TokenDistribution>,
  rowB: Row<TokenDistribution>,
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
  "Total Supply": {
    icon: undefined,
    tooltip: "The total number of tokens in existence.",
  },
  "Delegated Supply": {
    icon: undefined,
    tooltip:
      "The total number of tokens delegated, representing the maximum possible voting power. Any address holding over 50% of this supply effectively controls the DAO.",
  },
  "Circulating Supply": {
    icon: undefined,
    tooltip:
      "The total number of tokens issued or distributed. Often calculated as the total supply minus tokens held in DAO-controlled issuing or vesting contracts.",
  },
  "CEX Supply": {
    icon: undefined,
    tooltip: "The number of tokens available on centralized exchanges.",
  },
  "DEX Supply": {
    icon: undefined,
    tooltip: "The number of tokens available on decentralized exchanges.",
  },
  "Lending Supply": {
    icon: undefined,
    tooltip:
      "The number of tokens that can be borrowed through lending protocols.",
  },
};

export const TokenDistributionTable = () => {
  const { daoData } = useDaoDataContext();
  const {
    totalSupply,
    days,
    totalSupplyChart,
    delegatedSupply,
    delegatedSupplyChart,
    circulatingSupply,
    circulatingSupplyChart,
    cexSupply,
    cexSupplyChart,
    dexSupply,
    dexSupplyChart,
    lendingSupply,
    lendingSupplyChart,
  } = useTokenDistributionContext();

  const tokenDistributionColumns: ColumnDef<TokenDistribution>[] = [
    {
      accessorKey: "metric",
      cell: ({ row }) => {
        const metric: string = row.getValue("metric");
        const details = metric ? metricDetails[metric] : null;
        return (
          <p className="scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto text-[#fafafa]">
            {details && details.icon}
            {metric}
            {details && <TooltipInfo text={details.tooltip} />}
          </p>
        );
      },
      header: "Metrics",
    },
    {
      accessorKey: "currentValue",
      cell: ({ row }) => {
        const currentValue: number = row.getValue("currentValue");
        return (
          <div className="flex items-center justify-center text-center">
            {currentValue && formatNumberUserReadable(currentValue)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting()}
        >
          Current value ({daoData?.id})
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

        return (
          <p
            className={`flex items-center justify-center gap-1 text-center ${
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
          className="w-full"
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
        return (
          <div className="flex w-full">
            <Sparkline
              data={chartLastDays.map((item) => Number(item.high))}
              strokeColor={cn([Number(variation) < 0 ? "#ef4444" : "#4ADE80"])}
            />
          </div>
        );
      },
      header: ({ column }) => (
        <div className="flex w-full items-start justify-start">
          Last {days.slice(0, -1)} days
        </div>
      ),
    },
  ];

  return (
    <TheTable
      columns={tokenDistributionColumns}
      data={[
        {
          metric: "Total Supply",
          currentValue: totalSupply.value
            ? String(BigInt(totalSupply.value) / BigInt(10 ** 18))
            : null,
          variation: totalSupply.changeRate
            ? formatVariation(totalSupply.changeRate)
            : null,
          chartLastDays: totalSupplyChart,
        },
        {
          metric: "Delegated Supply",
          currentValue: delegatedSupply.value
            ? String(BigInt(delegatedSupply.value) / BigInt(10 ** 18))
            : null,
          variation: delegatedSupply.changeRate
            ? formatVariation(delegatedSupply.changeRate)
            : null,
          chartLastDays: delegatedSupplyChart,
        },
        {
          metric: "Circulating Supply",
          currentValue: circulatingSupply.value
            ? String(BigInt(circulatingSupply.value) / BigInt(10 ** 18))
            : null,
          variation: circulatingSupply.changeRate
            ? formatVariation(circulatingSupply.changeRate)
            : null,
          chartLastDays: circulatingSupplyChart,
        },
        {
          metric: "CEX Supply",
          currentValue: cexSupply.value
            ? String(BigInt(cexSupply.value) / BigInt(10 ** 18))
            : null,
          variation: cexSupply.changeRate
            ? formatVariation(cexSupply.changeRate)
            : null,
          chartLastDays: cexSupplyChart,
        },
        {
          metric: "DEX Supply",
          currentValue: dexSupply.value
            ? String(BigInt(dexSupply.value) / BigInt(10 ** 18))
            : null,
          variation: dexSupply.changeRate
            ? formatVariation(dexSupply.changeRate)
            : null,
          chartLastDays: dexSupplyChart,
        },
        {
          metric: "Lending Supply",
          currentValue: lendingSupply.value
            ? String(BigInt(lendingSupply.value) / BigInt(10 ** 18))
            : null,
          variation: lendingSupply.changeRate
            ? formatVariation(lendingSupply.changeRate)
            : null,
          chartLastDays: lendingSupplyChart,
        },
      ]}
      withPagination={true}
      withSorting={true}
    />
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  mockedTableChartMetrics,
  TokenDistribution,
} from "@/lib/mocked-data/mocked-data";
import { Button } from "@/shared/components/ui/button";
import {
  Sparkline,
  SkeletonRow,
  TheTable,
  TooltipInfo,
} from "@/shared/components";
import { DaoMetricsDayBucket } from "@/lib/dao-config/types";
import {
  cn,
  formatNumberUserReadable,
  formatVariation,
} from "@/lib/client/utils";
import { useTokenDistributionContext } from "@/shared/contexts/TokenDistributionContext";
import { useParams } from "next/navigation";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";

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
  Total: {
    icon: undefined,
    tooltip: "The total number of tokens in existence.",
  },
  Delegated: {
    icon: undefined,
    tooltip:
      "Delegated supply is the total number of tokens that have been delegated for voting, representing the maximum voting power that can currently be used.",
  },
  Circulating: {
    icon: undefined,
    tooltip:
      "The total number of tokens issued or distributed. Often calculated as the total supply minus tokens held in DAO-controlled issuing or vesting contracts.",
  },
  CEX: {
    icon: undefined,
    tooltip: "The number of tokens available on centralized exchanges.",
  },
  DEX: {
    icon: undefined,
    tooltip: "The number of tokens available on decentralized exchanges.",
  },
  Lending: {
    icon: undefined,
    tooltip:
      "The number of tokens that can be borrowed through lending protocols.",
  },
};

export const TokenDistributionTable = () => {
  const [mounted, setMounted] = useState<boolean>(false);
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
  const { daoId } = useParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  const tokenDistributionColumns: ColumnDef<TokenDistribution>[] = [
    {
      accessorKey: "metric",
      cell: ({ row }) => {
        const metric: string = row.getValue("metric");
        const currentValue = row.getValue("currentValue");
        const details = metric ? metricDetails[metric] : null;
        return (
          <p
            className={cn(
              "scrollbar-none flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto px-4 py-3 text-[#fafafa]",
              { "blur-[4px]": currentValue === null },
            )}
          >
            {details && details.icon}
            {metric}
            {details && <TooltipInfo text={details.tooltip} />}
          </p>
        );
      },
      header: () => (
        <div className="text-table-header flex w-full items-start justify-start pl-4">
          Supply
        </div>
      ),
    },
    {
      accessorKey: "currentValue",
      cell: ({ row }) => {
        const currentValue: number = row.getValue("currentValue");
        if (!mounted) {
          return (
            <SkeletonRow
              className="h-5 w-32"
              parentClassName="justify-end flex animate-pulse space-x-2"
            />
          );
        }
        if (currentValue === null) {
          const randomNumber = Math.floor(Math.random() * 999);
          const randomValues = ["K", "M"];
          return (
            <div className="flex items-center justify-end px-4 py-3 text-end blur-[4px]">
              {randomNumber}
              {randomValues[randomNumber % 2]}
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end px-4 py-3 text-end">
            {currentValue && formatNumberUserReadable(currentValue)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-table-header w-full justify-end px-4 text-end"
          onClick={() => column.toggleSorting()}
        >
          {String(daoId)?.toUpperCase()} Amount
          <ArrowUpDown
            props={{
              className: "ml-2 size-4",
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
        if (!mounted) {
          return (
            <div className="flex items-center justify-end">
              <SkeletonRow
                className="h-5 w-32"
                parentClassName="justify-end flex animate-pulse space-x-2"
              />
            </div>
          );
        }
        if (variation === null) {
          return (
            <div className="flex items-center justify-end text-green-400 blur-[4px]">
              {(Math.random() * 100).toFixed(2)}%
            </div>
          );
        }
        return (
          <p
            className={`flex items-center justify-end gap-1 px-4 py-3 text-end ${
              Number(variation) > 0
                ? "text-green-400"
                : Number(variation) < 0
                  ? "text-red-400"
                  : ""
            }`}
          >
            {Number(variation) > 0 ? (
              <ChevronUp className="size-4 text-green-400" />
            ) : Number(variation) < 0 ? (
              <ChevronDown className="size-4 text-red-400" />
            ) : null}
            {variation}%
          </p>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-table-header w-full justify-end px-4 text-end"
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
        if (!mounted) {
          return (
            <div className="flex w-full justify-center">
              <SkeletonRow className="h-5 w-32" />
            </div>
          );
        }
        if (chartLastDays.length === 0) {
          return (
            <div className="flex w-full justify-center py-2.5 blur-[4px]">
              <Sparkline
                data={mockedTableChartMetrics.map((item) => Number(item.high))}
                strokeColor={"#4ADE80"}
              />
            </div>
          );
        }
        return (
          <div className="flex w-full justify-center py-2.5">
            <Sparkline
              data={chartLastDays.map((item) => Number(item.high))}
              strokeColor={cn([Number(variation) < 0 ? "#f87171" : "#4ADE80"])}
            />
          </div>
        );
      },
      header: ({ column }) => (
        <div className="text-table-header flex w-full items-center justify-center pr-20">
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
          metric: "Total",
          currentValue: !!totalSupply.value
            ? String(BigInt(totalSupply.value) / BigInt(10 ** 18))
            : totalSupply.value,
          variation: totalSupply.changeRate
            ? formatVariation(totalSupply.changeRate)
            : totalSupply.changeRate,
          chartLastDays: totalSupplyChart,
        },
        {
          metric: "Delegated",
          currentValue: !!delegatedSupply.value
            ? String(BigInt(delegatedSupply.value) / BigInt(10 ** 18))
            : delegatedSupply.value,
          variation: delegatedSupply.changeRate
            ? formatVariation(delegatedSupply.changeRate)
            : delegatedSupply.changeRate,
          chartLastDays: delegatedSupplyChart,
        },
        {
          metric: "Circulating",
          currentValue: circulatingSupply.value
            ? String(BigInt(circulatingSupply.value) / BigInt(10 ** 18))
            : circulatingSupply.value,
          variation: circulatingSupply.changeRate
            ? formatVariation(circulatingSupply.changeRate)
            : circulatingSupply.changeRate,
          chartLastDays: circulatingSupplyChart,
        },
        {
          metric: "CEX",
          currentValue: cexSupply.value
            ? String(BigInt(cexSupply.value) / BigInt(10 ** 18))
            : cexSupply.value,
          variation: cexSupply.changeRate
            ? formatVariation(cexSupply.changeRate)
            : cexSupply.changeRate,
          chartLastDays: cexSupplyChart,
        },
        {
          metric: "DEX",
          currentValue: dexSupply.value
            ? String(BigInt(dexSupply.value) / BigInt(10 ** 18))
            : dexSupply.value,
          variation: dexSupply.changeRate
            ? formatVariation(dexSupply.changeRate)
            : dexSupply.changeRate,
          chartLastDays: dexSupplyChart,
        },
        {
          metric: "Lending",
          currentValue: lendingSupply.value
            ? String(BigInt(lendingSupply.value) / BigInt(10 ** 18))
            : lendingSupply.value,
          variation: lendingSupply.changeRate
            ? formatVariation(lendingSupply.changeRate)
            : lendingSupply.changeRate,
          chartLastDays: lendingSupplyChart,
        },
      ]}
      withPagination={true}
      withSorting={true}
    />
  );
};

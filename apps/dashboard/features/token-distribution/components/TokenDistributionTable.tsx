"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  mockedTableChartMetrics,
  TokenDistribution,
} from "@/shared/constants/mocked-data/mocked-data";
import { Button } from "@/shared/components/ui/button";
import {
  Sparkline,
  SkeletonRow,
  TheTable,
  TooltipInfo,
} from "@/shared/components";
import { DaoMetricsDayBucket } from "@/shared/dao-config/types";
import { formatVariation } from "@/shared/utils";
import { useParams } from "next/navigation";
import { ArrowState, ArrowUpDown } from "@/shared/components/icons";
import { cn, formatNumberUserReadable } from "@/shared/utils";
import { TokenDistributionContextProps } from "@/shared/contexts/types";

const sortingByAscendingOrDescendingNumber = (
  rowA: Row<TokenDistribution>,
  rowB: Row<TokenDistribution>,
  columnId: string,
) => {
  const a = Number(rowA.getValue(columnId)) ?? 0;
  const b = Number(rowB.getValue(columnId)) ?? 0;
  return a - b;
};

const metricDetails: Record<string, { icon: ReactNode; tooltip: string }> = {
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

interface TokenDistributionTableProps {
  value: TokenDistributionContextProps;
}

export const TokenDistributionTable = ({
  value,
}: TokenDistributionTableProps) => {
  const [mounted, setMounted] = useState<boolean>(false);

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
          <div
            className={cn(
              "scrollbar-none text-primary flex w-full max-w-48 items-center gap-2 space-x-1 overflow-auto px-4 py-3",
              { "blur-xs": currentValue === null },
            )}
          >
            {details && details.icon}
            {metric}
            {details && <TooltipInfo text={details.tooltip} />}
          </div>
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
            <div className="blur-xs flex items-center justify-end px-4 py-3 text-end">
              {randomNumber}
              {randomValues[randomNumber % 2]}
            </div>
          );
        }
        return (
          <div className="flex w-full items-center justify-end px-4 py-3 text-end">
            {currentValue && formatNumberUserReadable(currentValue)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="!text-table-header w-full justify-end px-4 text-end"
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
            <div className="flex w-full items-center justify-end">
              <SkeletonRow
                className="h-5 w-32"
                parentClassName="justify-end flex animate-pulse space-x-2"
              />
            </div>
          );
        }
        if (variation === null) {
          return (
            <div className="text-success blur-xs flex items-center justify-end">
              {(Math.random() * 100).toFixed(2)}%
            </div>
          );
        }
        return (
          <p
            className={`flex w-full items-center justify-end gap-1 px-4 py-3 text-end ${
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
          className="!text-table-header w-full justify-end px-4 text-end"
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
            <div className="blur-xs flex w-full justify-center py-2.5">
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
      header: () => (
        <div className="text-table-header flex w-full items-center justify-center pr-20">
          Last {value.days.slice(0, -1)} days
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
          currentValue: value.totalSupply.value
            ? String(BigInt(value.totalSupply.value) / BigInt(10 ** 18))
            : value.totalSupply.value,
          variation: value.totalSupply.changeRate
            ? formatVariation(value.totalSupply.changeRate)
            : value.totalSupply.changeRate,
          chartLastDays: value.totalSupplyChart,
        },
        {
          metric: "Delegated",
          currentValue: value.delegatedSupply.value
            ? String(BigInt(value.delegatedSupply.value) / BigInt(10 ** 18))
            : value.delegatedSupply.value,
          variation: value.delegatedSupply.changeRate
            ? formatVariation(value.delegatedSupply.changeRate)
            : value.delegatedSupply.changeRate,
          chartLastDays: value.delegatedSupplyChart,
        },
        {
          metric: "Circulating",
          currentValue: value.circulatingSupply.value
            ? String(BigInt(value.circulatingSupply.value) / BigInt(10 ** 18))
            : value.circulatingSupply.value,
          variation: value.circulatingSupply.changeRate
            ? formatVariation(value.circulatingSupply.changeRate)
            : value.circulatingSupply.changeRate,
          chartLastDays: value.circulatingSupplyChart,
        },
        {
          metric: "CEX",
          currentValue: value.cexSupply.value
            ? String(BigInt(value.cexSupply.value) / BigInt(10 ** 18))
            : value.cexSupply.value,
          variation: value.cexSupply.changeRate
            ? formatVariation(value.cexSupply.changeRate)
            : value.cexSupply.changeRate,
          chartLastDays: value.cexSupplyChart,
        },
        {
          metric: "DEX",
          currentValue: value.dexSupply.value
            ? String(BigInt(value.dexSupply.value) / BigInt(10 ** 18))
            : value.dexSupply.value,
          variation: value.dexSupply.changeRate
            ? formatVariation(value.dexSupply.changeRate)
            : value.dexSupply.changeRate,
          chartLastDays: value.dexSupplyChart,
        },
        {
          metric: "Lending",
          currentValue: value.lendingSupply.value
            ? String(BigInt(value.lendingSupply.value) / BigInt(10 ** 18))
            : value.lendingSupply.value,
          variation: value.lendingSupply.changeRate
            ? formatVariation(value.lendingSupply.changeRate)
            : value.lendingSupply.changeRate,
          chartLastDays: value.lendingSupplyChart,
        },
      ]}
      withPagination={true}
      withSorting={true}
    />
  );
};

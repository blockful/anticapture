"use client";

import React, { useEffect, useReducer } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TokenDistribution, tokenDistributionData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowState,
  ArrowUpDown,
  Sparkline,
  TimeInterval,
  TheTable,
  TooltipInfo,
} from "@/components/01-atoms";
import {
  fetchTimeSeriesDataFromGraphQL,
  DaoMetricsDayBucket,
} from "@/lib/server/backend";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import {
  cn,
  formatNumberUserReadable,
  formatVariation,
} from "@/lib/client/utils";
import { MetricTypesEnum } from "@/lib/client/constants";
import { formatUnits } from "viem";

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

interface State {
  data: TokenDistribution[];
}

//TODO: Doesn't make sense to have only one action of generic type UPDATE_METRIC,
// you should create UPDATE_DELEGATED_SUPPLY, UPDATE_TOTAL_SUPPLY, UPDATE_DEX_SUPPLY,
// this way the code will get more organized.
enum ActionType {
  UPDATE_METRIC = "UPDATE_METRIC",
  UPDATE_CHART = "UPDATE_CHART",
}

type MetricPayload = Pick<
  TokenDistribution,
  "currentValue" | "variation" | "chartLastDays"
>;

type Action = {
  type: ActionType;
  payload: {
    index: number;
    metric: MetricPayload;
  };
};

const initialState: State = {
  data: tokenDistributionData,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.UPDATE_METRIC:
      const data = [
        ...state.data.slice(0, action.payload.index),
        {
          ...state.data[action.payload.index],
          currentValue: action.payload.metric.currentValue,
          variation: action.payload.metric.variation,
        },
        ...state.data.slice(action.payload.index + 1, state.data.length),
      ];
      return {
        ...state,
        data,
      };
    case ActionType.UPDATE_CHART:
      const chartData = [
        ...state.data.slice(0, action.payload.index),
        {
          ...state.data[action.payload.index],
          chartLastDays: action.payload.metric.chartLastDays,
        },
        ...state.data.slice(action.payload.index + 1, state.data.length),
      ];
      return {
        ...state,
        data: chartData,
      };
    default:
      return state;
  }
}

export const TokenDistributionTable = ({ days }: { days: TimeInterval }) => {
  const { daoData } = useDaoDataContext();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const fetchTokenDistributionTableData = async (): Promise<void> => {
      const metrics = [
        { type: MetricTypesEnum.TOTAL_SUPPLY, index: 0 },
        { type: MetricTypesEnum.DELEGATED_SUPPLY, index: 1 },
        { type: MetricTypesEnum.CIRCULATING_SUPPLY, index: 2 },
        { type: MetricTypesEnum.CEX_SUPPLY, index: 3 },
        { type: MetricTypesEnum.DEX_SUPPLY, index: 4 },
        { type: MetricTypesEnum.LENDING_SUPPLY, index: 5 },
      ];

      try {
        const parsedDays = parseInt(days.split("d")[0]);

        if (!daoData) return;

        const chartDataPromises = metrics.map(async (metric) => {
          const metricType = metric.type
            .trim()
            .replace(/^"|"$/g, "") as MetricTypesEnum;
          const chartData = await fetchTimeSeriesDataFromGraphQL(
            daoData.id,
            metricType,
            parsedDays,
          );

          if (chartData) {
            return {
              index: metric.index,
              metric: {
                chartLastDays: chartData,
              },
            };
          }

          return null;
        });

        const results = await Promise.all(chartDataPromises);

        results.forEach((result) => {
          if (result) {
            let changeRate;
            const oldHigh = result.metric.chartLastDays[0]?.high ?? "0";
            const currentHigh =
              result.metric.chartLastDays[
                result.metric.chartLastDays.length - 1
              ]?.high ?? "0";
            if (currentHigh === "0") {
              changeRate = "0";
            } else {
              changeRate = formatUnits(
                (BigInt(currentHigh) * BigInt(1e18)) / BigInt(oldHigh) -
                  BigInt(1e18),
                18,
              );
            }

            dispatch({
              type: ActionType.UPDATE_CHART,
              payload: result,
            });
            dispatch({
              type: ActionType.UPDATE_METRIC,
              payload: {
                index: result.index,
                metric: {
                  currentValue: String(BigInt(currentHigh) / BigInt(10 ** 18)),
                  variation: formatVariation(changeRate),
                },
              },
            });
          }
        });
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchTokenDistributionTableData();
  }, [daoData, days]);

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
      data={state.data}
      withPagination={true}
      withSorting={true}
    />
  );
};

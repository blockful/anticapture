"use client";

import React, { useEffect, useReducer, useState } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  ChartMetrics,
  chartMetrics,
  TokenDistribution,
  tokenDistributionData,
} from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  AppleIcon,
  ArrowState,
  ArrowUpDown,
  Sparkline,
  TimeInterval,
  TheTable,
  TooltipInfo,
} from "@/components/01-atoms";
import {
  fetchCexSupply,
  fetchCirculatingSupply,
  fetchDelegatedSupply,
  fetchDexSupply,
  fetchGraphData,
  fetchLendingSupply,
  fetchTotalSupply,
} from "@/lib/server/backend";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { formatNumberUserReadble, formatVariation } from "@/lib/client/utils";
import { DaoId } from "@/lib/types/daos";
import { MetricTypesEnum } from "@/lib/client/constants";

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
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  "Delegated Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens delegated",
  },
  "Circulating Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in circulation",
  },
  "CEX Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in CEX",
  },
  "DEX Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in DEX",
  },
  "Lending Supply": {
    icon: <AppleIcon className="h-5 w-5" />,
    tooltip: "Total current value of tokens in lending",
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
}

type MetricPayload = Pick<
  TokenDistribution,
  "currentValue" | "variation" | "chartLastDays"
>;

type Action = {
  type: ActionType.UPDATE_METRIC;
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
          chartLastDays: action.payload.metric.chartLastDays,
        },
        ...state.data.slice(action.payload.index + 1, state.data.length),
      ];
      return {
        ...state,
        data,
      };
    default:
      return state;
  }
}

export const TokenDistributionTable = ({ days }: { days: TimeInterval }) => {
  const { daoData } = useDaoDataContext();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const daoId = (daoData && daoData.id) || DaoId.UNISWAP;

    fetchTotalSupply({ daoId, days }).then(async (result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 0,
            metric: {
              currentValue: String(
                BigInt(result.currentTotalSupply) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
              chartLastDays: await fetchGraphData(MetricTypesEnum.TOTAL_SUPPLY),
            },
          },
        });
    });

    fetchDelegatedSupply({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 1,
            metric: {
              currentValue: String(
                BigInt(result.currentDelegatedSupply) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchCirculatingSupply({
      daoId,
      days,
    }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 2,
            metric: {
              currentValue: String(
                BigInt(result.currentCirculatingSupply) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchCexSupply({
      daoId,
      days,
    }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 3,
            metric: {
              currentValue: String(
                BigInt(result.currentCexSupply) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchDexSupply({
      daoId,
      days,
    }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 4,
            metric: {
              currentValue: String(
                BigInt(result.currentDexSupply) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchLendingSupply({
      daoId,
      days,
    }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 5,
            metric: {
              currentValue: String(
                BigInt(result.currentLendingSupply) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });
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
            {currentValue && formatNumberUserReadble(currentValue)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Current value (UNI)
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
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
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
        // const chartLastDays: ChartMetrics = row.getValue("chartLastDays");
        // console.log("chartLastDays", chartLastDays);
        // const formattedData = transformChartMetrics([chartLastDays]);
        return (
          <div className="flex w-full items-start justify-start px-4">
            <Sparkline data={chartMetrics.map((item) => Number(item.high))} />
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

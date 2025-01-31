"use client";

import React, { useEffect, useReducer } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GovernanceActivity, governanceActivityData } from "@/lib/mocked-data";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  TimeInterval,
  TheTable,
  TooltipInfo,
  ArrowState,
  Sparkline,
} from "@/components/01-atoms";
import { useDaoDataContext } from "@/components/contexts/DaoDataContext";
import { formatNumberUserReadble, formatVariation } from "@/lib/client/utils";
import { DaoIdEnum } from "@/lib/types/daos";
import {
  DaoMetricsDayBucket,
  fetchActiveSupply,
  fetchAverageTurnout,
  fetchProposals,
  fetchTimeSeriesDataFromGraphQL,
  fetchTreasury,
  fetchVotes,
} from "@/lib/server/backend";
import { MetricTypesEnum } from "@/lib/client/constants";

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
    tooltip: "Total current value of tokens in circulation",
  },
  Proposals: {
    icon: undefined,
    tooltip: "Total current value of tokens in circulation",
  },
  "Active Supply": {
    icon: undefined,
    tooltip: "Total current value of tokens delegated",
  },
  Votes: {
    icon: undefined,
    tooltip: "Total current value of tokens in circulation",
  },
  "Average Turnout": {
    icon: undefined,
    tooltip: "Total current value of tokens in CEX",
  },
};

interface State {
  data: GovernanceActivity[];
}

enum ActionType {
  UPDATE_METRIC = "UPDATE_METRIC",
  UPDATE_CHART = "UPDATE_CHART",
}

type MetricPayload = Pick<
  GovernanceActivity,
  "average" | "variation" | "chartLastDays"
>;

type Action = {
  type: ActionType;
  payload: {
    index: number;
    metric: MetricPayload;
  };
};

const initialState: State = {
  data: governanceActivityData,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case ActionType.UPDATE_METRIC:
      const data = [
        ...state.data.slice(0, action.payload.index),
        {
          ...state.data[action.payload.index],
          average: action.payload.metric.average,
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

export const GovernanceActivityTable = ({ days }: { days: TimeInterval }) => {
  const { daoData } = useDaoDataContext();
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    const daoId = (daoData && daoData.id) || DaoIdEnum.UNISWAP;

    const fetchChartData = async (): Promise<void> => {
      const metrics = [{ type: MetricTypesEnum.TREASURY, index: 0 }];

      for (const metric of metrics) {
        const metricType = metric.type
          .trim()
          .replace(/^"|"$/g, "") as MetricTypesEnum;
        const chartData = await fetchTimeSeriesDataFromGraphQL(
          metricType,
          parseInt(days.split("d")[0]),
        );
        if (chartData) {
          dispatch({
            type: ActionType.UPDATE_CHART,
            payload: {
              index: metric.index,
              metric: {
                chartLastDays: chartData,
              },
            },
          });
        }
      }
    };

    fetchChartData();

    fetchTreasury({ daoId, days: days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 0,
            metric: {
              average: String(
                BigInt(result.currentTreasury) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchActiveSupply({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 2,
            metric: {
              average: String(BigInt(result.activeSupply) / BigInt(10 ** 18)),
              variation: "-",
            },
          },
        });
    });

    fetchProposals({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 1,
            metric: {
              average: result.currentProposalsLaunched,
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchVotes({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 3,
            metric: {
              average: result.currentVotes,
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });

    fetchAverageTurnout({ daoId, days }).then((result) => {
      result &&
        dispatch({
          type: ActionType.UPDATE_METRIC,
          payload: {
            index: 4,
            metric: {
              average: String(
                BigInt(result.currentAverageTurnout) / BigInt(10 ** 18),
              ),
              variation: formatVariation(result.changeRate),
            },
          },
        });
    });
  }, [daoData, days]);

  const governanceActivityColumns: ColumnDef<GovernanceActivity>[] = [
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
      accessorKey: "average",
      cell: ({ row }) => {
        const average: number = row.getValue("average");
        return (
          <div className="flex items-center justify-center text-center">
            {average ?? formatNumberUserReadble(average)}
          </div>
        );
      },
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="w-full"
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
        if (variation == "-") {
          return (
            <p className="flex items-center justify-center gap-1 text-center">
              -
            </p>
          );
        }
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
        const chartLastDays: DaoMetricsDayBucket[] =
          row.getValue("chartLastDays") ?? [];
        return (
          <div className="flex w-full items-start justify-start px-4">
            <Sparkline data={chartLastDays.map((item) => Number(item.high))} />
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
      columns={governanceActivityColumns}
      data={state.data}
      withPagination={true}
      withSorting={true}
    />
  );
};
